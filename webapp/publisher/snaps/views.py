import flask
from canonicalwebteam.snapstoreapi import authentication
import webapp.metrics.helper as metrics_helper
import webapp.metrics.metrics as metrics
import canonicalwebteam.snapstoreapi.publisher_api as api
from webapp.decorators import login_required
from webapp.publisher.snaps import logic
from json import loads
from canonicalwebteam.snapstoreapi.exceptions import (
    AgreementNotSigned,
    ApiError,
    ApiResponseErrorList,
    ApiTimeoutError,
    MacaroonRefreshRequired,
    MissingUsername
)


publisher_snaps = flask.Blueprint(
    'publisher_snaps', __name__,
    template_folder='/templates', static_folder='/static')


def refresh_redirect(path):
    macaroon_discharge = authentication.get_refreshed_discharge(
        flask.session['macaroon_discharge']
    )
    flask.session['macaroon_discharge'] = macaroon_discharge

    return flask.redirect(path)


def _handle_errors(api_error: ApiError):
    if type(api_error) is ApiTimeoutError:
        return flask.abort(504, str(api_error))
    elif type(api_error) is MissingUsername:
        return flask.redirect(
            flask.url_for('account.get_account_name'))
    elif type(api_error) is AgreementNotSigned:
        return flask.redirect(
            flask.url_for('account.get_agreement'))
    elif type(api_error) is MacaroonRefreshRequired:
        return refresh_redirect(
            flask.request.path
        )
    else:
        return flask.abort(502, str(api_error))


def _handle_error_list(errors):
    codes = [error['code'] for error in errors]

    error_messages = ', '.join(codes)
    return flask.abort(502, error_messages)


@publisher_snaps.route('/')
@login_required
def get_account_snaps():
    try:
        account_info = api.get_account(flask.session)
    except ApiResponseErrorList as api_response_error_list:
        return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    user_snaps, registered_snaps = logic.get_snaps_account_info(account_info)

    flask_user = flask.session['openid']

    context = {
        'snaps': user_snaps,
        'current_user': flask_user['nickname'],
        'registered_snaps': registered_snaps,
    }

    return flask.render_template(
        'publisher/account-snaps.html',
        **context
    )


@publisher_snaps.route('/<snap_name>/measure')
@login_required
def get_measure_snap(snap_name):
    return flask.redirect(
        flask.url_for(
            '.publisher_snap_metrics', snap_name))


@publisher_snaps.route('/<snap_name>/metrics')
@login_required
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

    installed_base = logic.get_installed_based_metric(installed_base_metric)
    metrics_query_json = metrics_helper.build_metrics_json(
        snap_id=details['snap_id'],
        installed_base=installed_base,
        metric_period=metric_requested['int'],
        metric_bucket=metric_requested['bucket'])

    try:
        metrics_response = api.get_publisher_metrics(
            flask.session,
            json=metrics_query_json)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, 'No snap named {}'.format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    active_metrics = metrics_helper.find_metric(
        metrics_response['metrics'], installed_base)
    active_devices = metrics.ActiveDevices(
        name=active_metrics['metric_name'],
        series=active_metrics['series'],
        buckets=active_metrics['buckets'],
        status=active_metrics['status'])

    latest_active = 0
    if active_devices:
        latest_active = active_devices.get_number_latest_active_devices()

    country_metric = metrics_helper.find_metric(
        metrics_response['metrics'], "weekly_installed_base_by_country")
    country_devices = metrics.CountryDevices(
        name=country_metric['metric_name'],
        series=country_metric['series'],
        buckets=country_metric['buckets'],
        status=country_metric['status'],
        private=True)

    territories_total = 0
    if country_devices:
        territories_total = country_devices.get_number_territories()

    nodata = not any([country_devices, active_devices])

    context = {
        # Data direct from details API
        'snap_name': snap_name,
        'snap_title': details['title'],
        'metric_period': metric_requested['period'],
        'active_device_metric': installed_base_metric,

        # Metrics data
        'nodata': nodata,
        'latest_active_devices': latest_active,
        'active_devices': dict(active_devices),
        'territories_total': territories_total,
        'territories': country_devices.country_data,

        # Context info
        'is_linux': 'Linux' in flask.request.headers['User-Agent']
    }

    return flask.render_template(
        'publisher/metrics.html',
        **context)


@publisher_snaps.route('/<snap_name>/market')
def get_market_snap(snap_name):
    return flask.redirect(
        flask.url_for('.get_listing_snap', snap_name=snap_name))


@publisher_snaps.route('/<snap_name>/listing', methods=['GET'])
@login_required
def get_listing_snap(snap_name):
    try:
        snap_details = api.get_snap_info(snap_name, flask.session)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 404:
            return flask.abort(404, 'No snap named {}'.format(snap_name))
        else:
            return _handle_error_list(api_response_error_list.errors)
    except ApiError as api_error:
        return _handle_errors(api_error)

    is_on_stable = logic.is_snap_on_stable(snap_details['channel_maps_list'])

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


@publisher_snaps.route('/<snap_name>/listing', methods=['POST'])
@login_required
def post_listing_snap(snap_name):
    changes = None
    changed_fields = flask.request.form.get('changes')

    if changed_fields:
        changes = loads(changed_fields)

    if changes:
        snap_id = flask.request.form.get('snap_id')
        error_list = []

        if 'images' in changes:
            # Add existing screenshots
            try:
                current_screenshots = api.snap_screenshots(
                    snap_id,
                    flask.session
                )
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, 'No snap named {}'.format(snap_name))
                else:
                    return _handle_error_list(api_response_error_list.errors)
            except ApiError as api_error:
                return _handle_errors(api_error)

            images_json, images_files = logic.build_changed_images(
                changes['images'], current_screenshots,
                flask.request.files.get('icon'),
                flask.request.files.getlist('screenshots'))

            try:
                api.snap_screenshots(
                    snap_id,
                    flask.session,
                    images_json,
                    images_files
                )
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, 'No snap named {}'.format(snap_name))
                else:
                    error_list = error_list + api_response_error_list.errors
            except ApiError as api_error:
                return _handle_errors(api_error)

        body_json = logic.filter_changes_data(changes)

        if body_json:
            if 'public_metrics_blacklist' in body_json:
                converted_metrics = logic.convert_metrics_blacklist(
                    body_json['public_metrics_blacklist'])
                body_json['public_metrics_blacklist'] = converted_metrics

            if 'description' in body_json:
                body_json['description'] = logic.remove_invalid_characters(
                    body_json['description'])

            try:
                api.snap_metadata(
                    snap_id, flask.session, body_json)
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, 'No snap named {}'.format(snap_name))
                else:
                    error_list = error_list + api_response_error_list.errors
            except ApiError as api_error:
                return _handle_errors(api_error)

        if error_list:
            try:
                snap_details = api.get_snap_info(snap_name, flask.session)
            except ApiResponseErrorList as api_response_error_list:
                if api_response_error_list.status_code == 404:
                    return flask.abort(
                        404, 'No snap named {}'.format(snap_name))
                else:
                    error_list = error_list + api_response_error_list.errors
            except ApiError as api_error:
                return _handle_errors(api_error)

            details_metrics_enabled = snap_details['public_metrics_enabled']
            details_blacklist = snap_details['public_metrics_blacklist']

            field_errors, other_errors = logic.invalid_field_errors(error_list)

            is_on_stable = logic.is_snap_on_stable(
                snap_details['channel_maps_list'])

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
                    else snap_details['title'] or ''
                ),
                "summary": (
                    changes['summary'] if 'summary' in changes
                    else snap_details['summary'] or ''
                ),
                "description": (
                    changes['description'] if 'description' in changes
                    else snap_details['description'] or ''
                ),
                "contact": (
                    changes['contact'] if 'contact' in changes
                    else snap_details['contact'] or ''
                ),
                "private": snap_details['private'],
                "website": (
                    changes['website'] if 'website' in changes
                    else snap_details['website'] or ''
                ),
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
        flask.url_for('.get_listing_snap', snap_name=snap_name))
