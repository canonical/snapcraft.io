import os
import urllib.parse

from webapp import api


api_session = api.requests.Session(timeout=(1, 6))


GITHUB_AUTH_SCOPE = "write:repo_hook read:org"
GITHUB_AUTH_LOGIN_URL = "https://github.com/login/oauth/authorize"
GITHUB_AUTH_VERIFY_URL = "https://github.com/login/oauth/access_token"
GITHUB_AUTH_CLIENT_ID = os.getenv("GITHUB_AUTH_CLIENT_ID")
GITHUB_AUTH_CLIENT_SECRET = os.getenv("GITHUB_AUTH_CLIENT_SECRET")


def get_oauth_url(
    redirect_url,
    secret,
    client_id=GITHUB_AUTH_CLIENT_ID,
    login_url=GITHUB_AUTH_LOGIN_URL,
    scope=GITHUB_AUTH_SCOPE,
):
    qs = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_url,
            "scope": scope,
            "state": secret,
            "allow_signup": True,
        }
    )

    return f"{login_url}?{qs}"


def exchange_code_for_token(code):
    response = api_session.post(
        url=GITHUB_AUTH_VERIFY_URL,
        json=dict(
            client_id=GITHUB_AUTH_CLIENT_ID,
            client_secret=GITHUB_AUTH_CLIENT_SECRET,
            code=code,
        ),
        headers={"Accept": "application/json"},
    )

    return response
