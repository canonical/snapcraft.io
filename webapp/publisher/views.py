import flask
from webapp import authentication
import webapp.api.dashboard as api
from webapp.decorators import login_required
from webapp.api.exceptions import (
    AgreementNotSigned,
    ApiError,
    ApiResponseErrorList,
    ApiTimeoutError,
    MacaroonRefreshRequired,
    MissingUsername
)


account = flask.Blueprint(
    'account', __name__,
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
            flask.url_for('.get_account_name'))
    elif type(api_error) is AgreementNotSigned:
        return flask.redirect(
            flask.url_for('.get_agreement'))
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


@account.route('/')
@login_required
def get_account():
    return flask.redirect(
        flask.url_for('publisher_snaps.get_account_snaps'))


@account.route('/details')
@login_required
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


@account.route('/agreement')
@login_required
def get_agreement():
    return flask.render_template('developer_programme_agreement.html')


@account.route('/agreement', methods=['POST'])
@login_required
def post_agreement():
    agreed = flask.request.form.get('i_agree')
    if agreed == 'on':
        try:
            api.post_agreement(flask.session, True)
        except ApiResponseErrorList as api_response_error_list:
            codes = [error['code'] for error in api_response_error_list.errors]
            error_messages = ', '.join(codes)
            flask.abort(502, error_messages)
        except ApiError as api_error:
            return _handle_errors(api_error)

        return flask.redirect(
            flask.url_for('.get_account'))
    else:
        return flask.redirect(
            flask.url_for('.get_agreement'))


@account.route('/username')
@login_required
def get_account_name():
    return flask.render_template('username.html')


@account.route('/username', methods=['POST'])
@login_required
def post_account_name():
    username = flask.request.form.get('username')

    if username:
        errors = []
        try:
            api.post_username(flask.session, username)
        except ApiResponseErrorList as api_response_error_list:
            errors = errors + api_response_error_list.errors
        except ApiError as api_error:
            return _handle_errors(api_error)

        if errors:
            return flask.render_template(
                'username.html',
                username=username,
                error_list=errors
            )

        return flask.redirect(
            flask.url_for('.get_account'))
    else:
        return flask.redirect(
            flask.url_for('.get_account_name'))


@account.route('/register-name')
@login_required
def get_register_name():
    snap_name = flask.request.args.get('snap_name', default='', type=str)
    is_private_str = flask.request.args.get(
        'is_private', default='False', type=str)
    is_private = is_private_str == 'True'

    conflict_str = flask.request.args.get(
        'conflict', default='False', type=str)
    conflict = conflict_str == 'True'

    already_owned_str = flask.request.args.get(
        'already_owned', default='False', type=str)
    already_owned = already_owned_str == 'True'

    is_private_str = flask.request.args.get(
        'is_private', default='False', type=str)
    is_private = is_private_str == 'True'

    context = {
        'snap_name': snap_name,
        'is_private': is_private,
        'conflict': conflict,
        'already_owned': already_owned,
    }
    return flask.render_template(
        'publisher/register-name.html',
        **context)


@account.route('/register-name', methods=['POST'])
@login_required
def post_register_name():
    snap_name = flask.request.form.get('snap-name')

    if not snap_name:
        return flask.redirect(
            flask.url_for('.get_register_name'))

    is_private = flask.request.form.get('is_private') == 'private'
    store = flask.request.form.get('store')
    registrant_comment = flask.request.form.get('registrant_comment')

    try:
        api.post_register_name(
            session=flask.session,
            snap_name=snap_name,
            is_private=is_private,
            store=store,
            registrant_comment=registrant_comment)
    except ApiResponseErrorList as api_response_error_list:
        if api_response_error_list.status_code == 409:
            for error in api_response_error_list.errors:
                if error['code'] == 'already_claimed':
                    return flask.redirect(
                        flask.url_for('.get_account'))
                elif error['code'] == 'already_registered':
                    return flask.redirect(
                        flask.url_for(
                            'account.get_register_name',
                            snap_name=snap_name,
                            is_private=is_private,
                            conflict=True))
                elif error['code'] == 'already_owned':
                    return flask.redirect(
                        flask.url_for(
                            'account.get_register_name',
                            snap_name=snap_name,
                            is_private=is_private,
                            already_owned=True))

        context = {
            'snap_name': snap_name,
            'is_private': is_private,
            'errors': api_response_error_list.errors,
        }

        return flask.render_template(
            'publisher/register-name.html',
            **context)
    except ApiError as api_error:
        return _handle_errors(api_error)

    flask.flash(''.join([
        snap_name,
        ' registered.',
        ' <a href="https://docs.snapcraft.io/build-snaps/upload"',
        ' class="p-link--external"',
        ' target="blank">How to upload a Snap</a>']))

    return flask.redirect(
        flask.url_for('.get_account'))
