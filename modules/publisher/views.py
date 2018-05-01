import flask
import hashlib
import modules.authentication as authentication
import modules.public.logic as public_logic
import modules.publisher.api as api
import modules.publisher.logic as logic
from json import dumps, loads
from operator import itemgetter
from modules.exceptions import (
    ApiError,
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


def _handle_errors(api_error: ApiError):
    if type(api_error) is ApiTimeoutError:
        return flask.abort(504, str(api_error))
    elif type(api_error) is MacaroonRefreshRequired:
        return refresh_redirect(
            flask.request.path
        )
    else:
        return flask.abort(502, str(api_error))


def _handle_error_list(errors):
    codes = []
    # TODO This has to be moved in the API module.
    # Should be done once all the errors catchings
    # are handled by this function.
    # https://github.com/canonical-websites/snapcraft.io/issues/609
    for error in errors:
        if error['code'] == 'user-not-ready':
            if 'has not signed agreement' in error['message']:
                return flask.redirect('/account/agreement')
            elif 'missing namespace' in error['message']:
                return flask.redirect('/account/username')
        else:
            codes.append(error['code'])

    error_messages = ', '.join(codes)
    return flask.abort(502, error_messages)


def get_account_details():
    try:
        # We don't use the data from this endpoint.
        # It is mostly used to make sure the user has signed
        # the terms and conditions.
        api.get_account(flask.session)
    except ApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    flask_user = flask.session['openid']
    context = {
        'image': flask_user['image'],
        'username': flask_user['nickname'],
        'displayname': flask_user['fullname'],
        'email': flask_user['email'],
    }

    return flask.render_template(
        'publisher/account-details.html',
        **context
    )


def get_account_snaps():
    try:
        account = api.get_account(flask.session)
    except ApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    user_snaps, registered_snaps = logic.get_snaps_account_info(account)

    flask_user = flask.session['openid']
    context = {
        'page_slug': 'my-snaps',
        'snaps': user_snaps,
        'current_user': flask_user['nickname'],
        'registered_snaps': registered_snaps,
    }

    return flask.render_template(
        'publisher/account-snaps.html',
        **context
    )


def get_agreement():
    return flask.render_template('developer_programme_agreement.html')


def post_agreement():
    agreed = flask.request.form.get('i_agree')
    if agreed == 'on':
        try:
            api.post_agreement(flask.session, True)
        except ApiTimeoutError as api_timeout_error:
            flask.abort(504, str(api_timeout_error))
        except ApiConnectionError as api_connection_error:
            flask.abort(502, str(api_connection_error))
        except ApiResponseDecodeError as api_response_decode_error:
            flask.abort(502, str(api_response_decode_error))
        except ApiResponseErrorList as api_response_error_list:
            codes = [error['code'] for error in api_response_error_list.errors]
            error_messages = ', '.join(codes)
            flask.abort(502, error_messages)
        except ApiResponseError as api_response_error:
            flask.abort(502, str(api_response_error))
        except MacaroonRefreshRequired:
            return refresh_redirect(
                flask.request.path
            )

        return flask.redirect('/account')
    else:
        return flask.redirect('/account/agreement')


def get_account_name():
    return flask.render_template('username.html')


def post_account_name():
    username = flask.request.form.get('username')

    if username:
        errors = []
        try:
            api.post_username(flask.session, username)
        except ApiTimeoutError as api_timeout_error:
            flask.abort(504, str(api_timeout_error))
        except ApiConnectionError as api_connection_error:
            flask.abort(502, str(api_connection_error))
        except ApiResponseDecodeError as api_response_decode_error:
            flask.abort(502, str(api_response_decode_error))
        except ApiResponseErrorList as api_response_error_list:
            errors = errors + api_response_error_list.errors
        except ApiResponseError as api_response_error:
            flask.abort(502, str(api_response_error))
        except MacaroonRefreshRequired:
            return refresh_redirect(
                flask.request.path
            )

        if errors:
            return flask.render_template(
                'username.html',
                username=username,
                error_list=errors
            )

        return flask.redirect('/account')
    else:
        return flask.redirect('/account/username')


def publisher_snap_metrics(snap_name):
    """
    A view to display the snap metrics page for specific snaps.

    This queries the snapcraft API (api.snapcraft.io) and passes
    some of the data through to the publisher/metrics.html template,
    with appropriate sanitation.
    """
    try:
        details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, 'No snap named {}'.format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    metric_requested = logic.extract_metrics_period(
        flask.request.args.get('period', default='30d', type=str))

    installed_base_metric = logic.verify_base_metrics(
        flask.request.args.get(
            'active-devices',
            default='version',
            type=str))

    metrics_query_json = logic.build_metrics_json(
        snap_id=details['snap_id'],
        metric_period=metric_requested['int'],
        metric_bucket=metric_requested['bucket'],
        installed_base_metric=installed_base_metric)

    try:
        metrics_response_json = api.get_publisher_metrics(
            flask.session,
            json=metrics_query_json)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, 'No snap named {}'.format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    nodata = logic.has_data(metrics_response_json['metrics'])

    active_devices = {
        'series': metrics_response_json['metrics'][0]['series'],
        'buckets': metrics_response_json['metrics'][0]['buckets']
    }
    active_devices['series'] = sorted(
        active_devices['series'],
        key=itemgetter('name'))

    latest_active_devices = logic.get_number_latest_active_devices(
        active_devices)

    users_by_country = public_logic.calculate_metrics_countries(
        metrics_response_json['metrics'][1]['series'])

    country_data = public_logic.build_country_info(
        users_by_country,
        True)

    territories_total = logic.get_number_territories(country_data)

    context = {
        'page_slug': 'my-snaps',
        # Data direct from details API
        'snap_name': snap_name,
        'snap_title': details['title'],
        'metric_period': metric_requested['period'],
        'active_device_metric': installed_base_metric,

        # Metrics data
        'nodata': nodata,
        'latest_active_devices': latest_active_devices,
        'active_devices': active_devices,
        'territories_total': territories_total,
        'territories': country_data,

        # Context info
        'is_linux': 'Linux' in flask.request.headers['User-Agent']
    }

    return flask.render_template(
        'publisher/metrics.html',
        **context)


def get_listing_snap(snap_name):
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
            codes = []
            for error in api_response_error_list.errors:
                if error['code'] == 'user-not-ready':
                    if 'has not signed agreement' in error['message']:
                        return flask.redirect('/account/agreement')
                    elif 'missing namespace' in error['message']:
                        return flask.redirect('/account/username')
                else:
                    codes.append(error['code'])
            error_messages = ', '.join(codes)
            flask.abort(502, error_messages)
    except ApiResponseError as api_response_error:
        flask.abort(502, str(api_response_error))
    except MacaroonRefreshRequired:
        return refresh_redirect(
            flask.request.path
        )

    is_on_stable = False
    for series in snap_details['channel_maps_list']:
        for series_map in series['map']:
            is_on_stable = (
                is_on_stable or
                'channel' in series_map and
                series_map['channel'] == 'stable' and
                series_map['info'])

    # Filter icon & screenshot urls from the media set.
    icon_urls = [
        m['url'] for m in snap_details['media']
        if m['type'] == 'icon']
    screenshot_urls = [
        m['url'] for m in snap_details['media']
        if m['type'] == 'screenshot']

    context = {
        "page_slug": 'my-snaps',
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
        "private": snap_details['private'],
        "website": snap_details['website'] or '',
        "public_metrics_enabled": snap_details['public_metrics_enabled'],
        "public_metrics_blacklist": snap_details['public_metrics_blacklist'],
        "is_on_stable": is_on_stable,
    }

    return flask.render_template(
        'publisher/listing.html',
        **context
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


def post_listing_snap(snap_name):
    changes = None
    changed_fields = flask.request.form.get('changes')

    if changed_fields:
        changes = loads(changed_fields)

    if changes:
        snap_id = flask.request.form.get('snap_id')
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
                    codes = []
                    for error in api_response_error_list.errors:
                        if error['code'] == 'user-not-ready':
                            if 'has not signed agreement' in error['message']:
                                return flask.redirect('/account/agreement')
                            elif 'missing namespace' in error['message']:
                                return flask.redirect('/account/username')
                        else:
                            codes.append(error['code'])
                    error_messages = ', '.join(codes)
                    flask.abort(502, error_messages)
            except ApiResponseError as api_response_error:
                flask.abort(502, str(api_response_error))
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
                api.snap_screenshots(
                    snap_id,
                    flask.session,
                    images_json,
                    images_files
                )
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
                    error_list = error_list + api_response_error_list.errors
            except ApiResponseError as api_response_error:
                flask.abort(502, str(api_response_error))
            except MacaroonRefreshRequired:
                return refresh_redirect(
                    flask.request.path
                )
            except MacaroonRefreshRequired:
                return refresh_redirect(
                    flask.request.path
                )

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
                api.snap_metadata(
                    flask.request.form['snap_id'],
                    flask.session,
                    body_json
                )
            except ApiConnectionError as api_connection_error:
                flask.abort(502, str(api_connection_error))
            except ApiTimeoutError as api_timeout_error:
                flask.abort(504, str(api_timeout_error))
            except ApiResponseDecodeError as api_response_decode_error:
                flask.abort(502, str(api_response_decode_error))
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    flask.abort(404, 'No snap named {}'.format(snap_name))
                else:
                    error_list = error_list + api_response_error_list.errors
            except ApiResponseError as api_response_error:
                flask.abort(502, str(api_response_error))
            except MacaroonRefreshRequired:
                return refresh_redirect(
                    flask.request.path
                )

        if error_list:
            try:
                snap_details = api.get_snap_info(snap_name, flask.session)
            except ApiConnectionError as api_connection_error:
                flask.abort(502, str(api_connection_error))
            except ApiTimeoutError as api_timeout_error:
                flask.abort(504, str(api_timeout_error))
            except ApiResponseDecodeError as api_response_decode_error:
                flask.abort(502, str(api_response_decode_error))
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    flask.abort(404, 'No snap named {}'.format(snap_name))
                else:
                    error_list = error_list + api_response_error_list.errors
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

            is_on_stable = False
            for series in snap_details['channel_maps_list']:
                for series_map in series['map']:
                    is_on_stable = (
                        is_on_stable or
                        'channel' in series_map and
                        series_map['channel'] == 'stable' and
                        series_map['info'])

            # Filter icon & screenshot urls from the media set.
            icon_urls = [
                m['url'] for m in snap_details['media']
                if m['type'] == 'icon']
            screenshot_urls = [
                m['url'] for m in snap_details['media']
                if m['type'] == 'screenshot']

            context = {
                "page_slug": 'my-snaps',
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
                "private": snap_details['private'],
                "website": website or '',
                "is_on_stable": is_on_stable,
                # errors
                "error_list": error_list,
                "field_errors": field_errors,
                "other_errors": other_errors
            }

            return flask.render_template(
                'publisher/listing.html',
                **context
            )

        flask.flash("Changes applied successfully.", 'positive')
    else:
        flask.flash("No changes to save.", 'information')

    return flask.redirect(
        "/account/snaps/{snap_name}/listing".format(
            snap_name=snap_name
        )
    )
