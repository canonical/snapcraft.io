import datetime
import flask
import hashlib
import modules.authentication as authentication
import modules.public.logic as public_logic
import modules.publisher.api as api
from dateutil import relativedelta
from json import dumps, loads
from operator import itemgetter
from modules.exceptions import (
    ApiTimeoutError,
    ApiConnectionError,
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList,
    MacaroonRefreshRequired
)


def refresh_redirect(path):
    macaroon_discharge = authentication.get_refreshed_discharge(
        flask.session['macaroon_discharge']
    )
    flask.session['macaroon_discharge'] = macaroon_discharge

    return flask.redirect(path)


def get_account():
    try:
        account = api.get_account(flask.session)

        error_list = []
        if 'error_list' in account:
            for error in account['error_list']:
                if error['code'] == 'user-not-ready':
                    if 'has not signed agreement' in error['message']:
                        return flask.redirect('/account/agreement')
                    elif 'missing namespace' in error['message']:
                        return flask.redirect('/account/username')
                else:
                    error_list.append(error)

            context = {
                'error_list': error_list
            }
        else:
            user_snaps = []
            if '16' in account['snaps']:
                user_snaps = account['snaps']['16']

            flask_user = flask.session['openid']

            context = {
                'image': flask_user['image'],
                'username': flask_user['nickname'],
                'displayname': flask_user['fullname'],
                'email': account['email'],
                'snaps': user_snaps,
                'error_list': error_list
            }

        return flask.render_template(
            'account.html',
            **context
        )
    except MacaroonRefreshRequired:
        return refresh_redirect(
            flask.request.path
        )


def get_agreement():
    return flask.render_template('developer_programme_agreement.html')


def post_agreement():
    agreed = flask.request.form.get('i_agree')

    if agreed == 'on':
        try:
            api.post_agreement(flask.session, True)
        except MacaroonRefreshRequired:
            return refresh_redirect(
                '/account/agreement'
            )
        return flask.redirect('/account')
    else:
        return flask.redirect('/account/agreement')


def get_account_name():
    return flask.render_template('username.html')


def post_account_name():
    username = flask.request.form.get('username')

    if username:
        try:
            response = api.post_username(flask.session, username)
        except MacaroonRefreshRequired:
            return refresh_redirect(
                '/account/username'
            )

        if 'error_list' in response:
            return flask.render_template(
                'username.html',
                username=username,
                error_list=response['error_list']
            )
        else:
            return flask.redirect('/account')
    else:
        return flask.redirect('/account/username')


def publisher_snap_measure(snap_name):
    """
    A view to display the snap measure page for specific snaps.

    This queries the snapcraft API (api.snapcraft.io) and passes
    some of the data through to the publisher/measure.html template,
    with appropriate sanitation.
    """
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiTimeoutError as api_timeout_error:
        flask.abort(504, str(api_timeout_error))
    except ApiResponseDecodeError as api_response_decode_error:
        flask.abort(502, str(api_response_decode_error))
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            flask.abort(404, 'No snap named {}'.format(snap_name))
        else:
            codes = [error['code'] for error in api_response_error_list.errors]
            error_messages = ', '.join(codes)
            flask.abort(502, error_messages)
    except ApiResponseError as api_response_error:
        flask.abort(502, str(api_response_error))
    except MacaroonRefreshRequired:
        return refresh_redirect(
            flask.request.path
        )

    metric_period = flask.request.args.get('period', default='30d', type=str)
    metric_bucket = ''.join([i for i in metric_period if not i.isdigit()])
    metric_period_int = int(metric_period[:-1])

    installed_base_metric = flask.request.args.get(
        'active-devices',
        default='version',
        type=str
    )

    today = datetime.datetime.utcnow().date()
    end = today - relativedelta.relativedelta(days=1)
    start = None
    if metric_bucket == 'd':
        start = end - relativedelta.relativedelta(days=metric_period_int)
    elif metric_bucket == 'm':
        start = end - relativedelta.relativedelta(months=metric_period_int)

    if installed_base_metric == 'version':
        installed_base = "weekly_installed_base_by_version"
    elif installed_base_metric == 'os':
        installed_base = "weekly_installed_base_by_operating_system"
    metrics_query_json = {
        "filters": [
            {
                "metric_name": installed_base,
                "snap_id": details['snap_id'],
                "start": start.strftime('%Y-%m-%d'),
                "end": end.strftime('%Y-%m-%d')
            },
            {
                "metric_name": "weekly_installed_base_by_country",
                "snap_id": details['snap_id'],
                "start": end.strftime('%Y-%m-%d'),
                "end": end.strftime('%Y-%m-%d')
            }
        ]
    }

    try:
        metrics_response_json = api.get_publisher_metrics(
            flask.session,
            json=metrics_query_json
        )
    except MacaroonRefreshRequired:
        return refresh_redirect(
            flask.request.path
        )

    nodata = True

    for metric in metrics_response_json['metrics']:
        if metric['status'] == 'OK':
            nodata = False

    active_devices = metrics_response_json['metrics'][0]
    active_devices['series'] = sorted(
        active_devices['series'],
        key=itemgetter('name')
    )
    latest_active_devices = 0

    for series_index, series in enumerate(active_devices['series']):
        for index, value in enumerate(series['values']):
            if value is None:
                active_devices['series'][series_index]['values'][index] = 0
        values = series['values']
        if len(values) == len(active_devices['buckets']):
            latest_active_devices += values[len(values)-1]

    active_devices = {
        'series': active_devices['series'],
        'buckets': active_devices['buckets']
    }

    users_by_country = public_logic.calculate_metrics_countries(
        metrics_response_json['metrics'][1]['series']
    )

    country_data = public_logic.build_country_info(
        users_by_country,
        True
    )
    territories_total = 0
    for data in country_data.values():
        if data['number_of_users'] > 0:
            territories_total += 1

    context = {
        # Data direct from details API
        'snap_name': snap_name,
        'snap_title': details['title'],
        'metric_period': metric_period,
        'active_device_metric': installed_base_metric,

        # Metrics data
        'nodata': nodata,
        'latest_active_devices': "{:,}".format(latest_active_devices),
        'active_devices': active_devices,
        'territories_total': territories_total,
        'territories': country_data,

        # Context info
        'is_linux': 'Linux' in flask.request.headers['User-Agent']
    }

    return flask.render_template(
        'publisher/measure.html',
        **context
    )


def get_market_snap(snap_name):
    try:
        snap_details = api.get_snap_info(snap_name, flask.session)
    except ApiTimeoutError as api_timeout_error:
        flask.abort(504, str(api_timeout_error))
    except ApiConnectionError as api_connection_error:
        flask.abort(502, str(api_connection_error))
    except ApiResponseDecodeError as api_response_decode_error:
        flask.abort(502, str(api_response_decode_error))
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            flask.abort(404, 'No snap named {}'.format(snap_name))
        else:
            codes = [error['code'] for error in api_response_error_list.errors]
            error_messages = ', '.join(codes)
            flask.abort(502, error_messages)
    except ApiResponseError as api_response_error:
        flask.abort(502, str(api_response_error))
    except MacaroonRefreshRequired:
        return refresh_redirect(
            flask.request.path
        )

    # Filter icon & screenshot urls from the media set.
    icon_urls = [
        m['url'] for m in snap_details['media']
        if m['type'] == 'icon']
    screenshot_urls = [
        m['url'] for m in snap_details['media']
        if m['type'] == 'screenshot']

    context = {
        "snap_id": snap_details['snap_id'],
        "snap_name": snap_details['snap_name'],
        "snap_title": snap_details['title'],
        "summary": snap_details['summary'],
        "description": snap_details['description'],
        "license": snap_details['license'],
        "icon_url": icon_urls[0] if icon_urls else None,
        "publisher_name": snap_details['publisher']['display-name'],
        "screenshot_urls": screenshot_urls,
        "contact": snap_details['contact'],
        "website": snap_details['website'] or '',
        "public_metrics_enabled": snap_details['public_metrics_enabled'],
        "public_metrics_blacklist": snap_details['public_metrics_blacklist'],
    }

    return flask.render_template(
        'publisher/market.html',
        **context
    )


def snap_release(snap_name):
    try:
        snap_id = api.get_snap_id(snap_name, flask.session)
    except ApiTimeoutError as api_timeout_error:
        flask.abort(504, str(api_timeout_error))
    except ApiResponseDecodeError as api_response_decode_error:
        flask.abort(502, str(api_response_decode_error))
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            flask.abort(404, 'No snap named {}'.format(snap_name))
        else:
            codes = [error['code'] for error in api_response_error_list.errors]
            error_messages = ', '.join(codes)
            flask.abort(502, error_messages)
    except ApiResponseError as api_response_error:
        flask.abort(502, str(api_response_error))
    except MacaroonRefreshRequired:
        return refresh_redirect(
            flask.request.path
        )

    try:
        status_json = api.get_snap_status(snap_id, flask.session)
    except MacaroonRefreshRequired:
        return refresh_redirect(
            flask.request.path
        )

    return flask.render_template(
        'publisher/release.html',
        snap_name=snap_name,
        status=status_json,
    )


def build_image_info(image, image_type):
    """
    Build info json structure for image upload
    Return json oject with useful informations for the api
    """
    hasher = hashlib.sha256(image.read())
    hash_final = hasher.hexdigest()
    image.seek(0)

    return {
        "key": image.filename,
        "type": image_type,
        "filename": image.filename,
        "hash": hash_final
    }


def post_market_snap(snap_name):
    changes = None
    changed_fields = flask.request.form['changes']

    if changed_fields:
        changes = loads(changed_fields)

    if changes:
        snap_id = flask.request.form['snap_id']
        error_list = []
        info = []
        images_files = []
        images_json = None

        if 'images' in changes:
            # Add existing screenshots
            try:
                current_screenshots = api.snap_screenshots(
                    snap_id,
                    flask.session
                )
            except MacaroonRefreshRequired:
                return refresh_redirect(
                    flask.request.path
                )

            changed_screenshots = changes['images']

            for changed_screenshot in changed_screenshots:
                for current_screenshot in current_screenshots:
                    if changed_screenshot['url'] == current_screenshot['url']:
                        info.append(current_screenshot)

            # Add new icon
            icon = flask.request.files.get('icon')
            if icon is not None:
                info.append(build_image_info(icon, 'icon'))
                images_files.append(icon)

            # Add new screenshots
            new_screenshots = flask.request.files.getlist('screenshots')
            for new_screenshot in new_screenshots:
                for changed_screenshot in changed_screenshots:
                    is_same = (
                        changed_screenshot['status'] == 'new' and
                        changed_screenshot['name'] == new_screenshot.filename
                    )

                    if is_same:
                        info.append(
                            build_image_info(new_screenshot, 'screenshot')
                        )
                        images_files.append(new_screenshot)

            images_json = {'info': dumps(info)}
            try:
                screenshots_response = api.snap_screenshots(
                    snap_id,
                    flask.session,
                    images_json,
                    images_files
                )
            except MacaroonRefreshRequired:
                return refresh_redirect(
                    flask.request.path
                )

            if 'error_list' in screenshots_response:
                error_list = error_list + screenshots_response['error_list']

        whitelist = [
            'title',
            'summary',
            'description',
            'contact',
            'website',
            'keywords',
            'license',
            'price',
            'blacklist_countries',
            'whitelist_countries',
            'public_metrics_enabled',
            'public_metrics_blacklist'
        ]

        body_json = {
            key: changes[key]
            for key in whitelist if key in changes
        }

        if body_json:
            if 'public_metrics_blacklist' in body_json:
                # if metrics blacklist was changed, split it into array
                metrics_blacklist = body_json['public_metrics_blacklist']

                if len(metrics_blacklist) > 0:
                    metrics_blacklist = metrics_blacklist.split(',')
                else:
                    metrics_blacklist = []

                body_json['public_metrics_blacklist'] = metrics_blacklist

            if 'description' in body_json:
                # remove invalid characters from description
                body_json['description'] = (
                    body_json['description'].replace('\r\n', '\n')
                )

            try:
                metadata = api.snap_metadata(
                    flask.request.form['snap_id'],
                    flask.session,
                    body_json
                )
            except MacaroonRefreshRequired:
                return refresh_redirect(
                    flask.request.path
                )
            if 'error_list' in metadata:
                error_list = error_list + metadata['error_list']

        if error_list:
            try:
                snap_details = api.get_snap_info(snap_name, flask.session)
            except ApiTimeoutError as api_timeout_error:
                flask.abort(504, str(api_timeout_error))
            except ApiResponseDecodeError as api_response_decode_error:
                flask.abort(502, str(api_response_decode_error))
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    flask.abort(404, 'No snap named {}'.format(snap_name))
                else:
                    errors = api_response_error_list.errors
                    codes = [error['code'] for error in errors]
                    error_messages = ', '.join(codes)
                    flask.abort(502, error_messages)
            except ApiResponseError as api_response_error:
                flask.abort(502, str(api_response_error))
            except MacaroonRefreshRequired:
                return refresh_redirect(
                    flask.request.path
                )

            details_metrics_enabled = snap_details['public_metrics_enabled']
            details_blacklist = snap_details['public_metrics_blacklist']

            field_errors = {}
            other_errors = []

            for error in error_list:
                if (error['code'] == 'invalid-field' or
                        error['code'] == 'required'):
                    field_errors[error['extra']['name']] = error['message']
                else:
                    other_errors.append(error)

            website = (
                changes['website'] if 'website' in changes
                else snap_details['website']
            )

            # Filter icon & screenshot urls from the media set.
            icon_urls = [
                m['url'] for m in snap_details['media']
                if m['type'] == 'icon']
            screenshot_urls = [
                m['url'] for m in snap_details['media']
                if m['type'] == 'screenshot']

            context = {
                # read-only values from details API
                "snap_id": snap_details['snap_id'],
                "snap_name": snap_details['snap_name'],
                "license": snap_details['license'],
                "icon_url": icon_urls[0] if icon_urls else None,
                "publisher_name": snap_details['publisher']['display-name'],
                "screenshot_urls": screenshot_urls,
                "public_metrics_enabled": details_metrics_enabled,
                "public_metrics_blacklist": details_blacklist,
                "display_title": snap_details['title'],
                # values posted by user
                "snap_title": (
                    changes['title'] if 'title' in changes
                    else snap_details['title']
                ),
                "summary": (
                    changes['summary'] if 'summary' in changes
                    else snap_details['summary']
                ),
                "description": (
                    changes['description'] if 'description' in changes
                    else snap_details['description']
                ),
                "contact": (
                    changes['contact'] if 'contact' in changes
                    else snap_details['contact']
                ),
                "website": website or '',
                # errors
                "error_list": error_list,
                "field_errors": field_errors,
                "other_errors": other_errors
            }

            return flask.render_template(
                'publisher/market.html',
                **context
            )

        flask.flash("Changes applied successfully.", 'positive')
    else:
        flask.flash("No changes to save.", 'information')

    return flask.redirect(
        "/account/snaps/{snap_name}/market".format(
            snap_name=snap_name
        )
    )
