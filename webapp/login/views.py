import flask
import os

from flask_openid import OpenID

from webapp import authentication
from webapp.api import dashboard
from webapp.login.macaroon import (
    MacaroonRequest,
    MacaroonResponse,
)

login = flask.Blueprint(
    'login', __name__,
    template_folder='/templates', static_folder='/static')

LOGIN_URL = os.getenv(
    'LOGIN_URL',
    'https://login.ubuntu.com',
)
open_id = OpenID(
    stateless=True,
    safe_roots=[],
    extension_responses=[MacaroonResponse]
)


@login.route('/login', methods=['GET', 'POST'])
@open_id.loginhandler
def login_handler():
    if authentication.is_authenticated(flask.session):
        return flask.redirect(open_id.get_next_url())

    root = authentication.request_macaroon()
    openid_macaroon = MacaroonRequest(
        caveat_id=authentication.get_caveat_id(root)
    )
    flask.session['macaroon_root'] = root

    return open_id.try_login(
        LOGIN_URL,
        ask_for=['email', 'nickname', 'image'],
        ask_for_optional=['fullname'],
        extensions=[openid_macaroon]
    )


@open_id.after_login
def after_login(resp):
    flask.session['macaroon_discharge'] = resp.extensions['macaroon'].discharge

    try:
        account = dashboard.get_account(flask.session)
        flask.session['openid'] = {
            'identity_url': resp.identity_url,
            'nickname': account['username'],
            'fullname': account['displayname'],
            'image': resp.image,
            'email': account['email']
        }
    except Exception:
        flask.session['openid'] = {
            'identity_url': resp.identity_url,
            'nickname': resp.nickname,
            'fullname': resp.fullname,
            'image': resp.image,
            'email': resp.email
        }

    return flask.redirect(open_id.get_next_url())


@login.route('/logout')
def logout():
    no_redirect = flask.request.args.get('no_redirect')

    if authentication.is_authenticated(flask.session):
        authentication.empty_session(flask.session)

    if no_redirect == 'true':
        return flask.redirect('/')
    else:
        return flask.redirect('https://build.snapcraft.io/auth/logout')
