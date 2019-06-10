import os

from webapp import api
from webapp.api.exceptions import (
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList,
)

MARKETO_URL = os.getenv("MARKETO_URL", "test.com/")
MARKETO_CLIENT_ID = os.getenv("MARKETO_CLIENT_ID", "123")
MARKETO_CLIENT_SECRET = os.getenv("MARKETO_CLIENT_SECRET", "321")

AUTH_URL = "".join(
    [
        "https://",
        MARKETO_URL,
        "identity/oauth/token?grant_type=client_credentials&client_id=",
        MARKETO_CLIENT_ID,
        "&client_secret=",
        MARKETO_CLIENT_SECRET,
    ]
)

LEAD_BY_EMAIL = "".join(
    [
        "https://",
        MARKETO_URL,
        "rest/v1/leads.json?access_token={token}",
        "&filterType=email&filterValues={email}&fields=id",
    ]
)

LEAD_NEWSLETTER_SUBSCRIPTION = "".join(
    [
        "https://",
        MARKETO_URL,
        "rest/v1/",
        "lead/{lead_id}.json?access_token={token}",
        "&fields=id,email,snapcraftnewsletter",
    ]
)

LEADS = "".join(
    ["https://", MARKETO_URL, "rest/v1/", "leads.json?access_token={token}"]
)


class MarketoApi:
    # Marketo isn't fast, so give it plenty of time to make a connection,
    # and respond
    def __init__(self, api_session=api.requests.Session(timeout=(2, 12))):
        self.api_session = api_session
        self.token = None

    def _authenticate(self):
        request = self.api_session.get(AUTH_URL)
        response = self._process_response(request)
        self.token = response["access_token"]

    def _process_response(self, response):
        try:
            body = response.json()
        except ValueError as decode_error:
            api_error_exception = ApiResponseDecodeError(
                "JSON decoding failed: {}".format(decode_error)
            )
            raise api_error_exception

        if not response.ok:
            if body.get("success") is False:
                api_error_exception = ApiResponseErrorList(
                    "The api returned a list of errors",
                    body["errors"][0]["code"],
                    map(lambda error: error["message"], body["errors"]),
                )

                raise api_error_exception
            else:
                raise ApiResponseError("Unknown error from api", 500)

        return body

    def request(self, method, url, url_args={}, json=None):
        if not self.token:
            self._authenticate()

        # Always format token here to make sure it's set
        url = url.format(token=self.token, **url_args)
        response = self.api_session.request(method=method, url=url, json=json)

        # If there was a failure because the
        # token expired try to authentiacte again
        if response.status_code in [601, 602]:
            self._authenticate()
            response = self.api_session.request(method=method, url=url)

        return self._process_response(response)

    def get_user(self, email):
        response = self.request(
            method="GET", url=LEAD_BY_EMAIL, url_args=dict(email=email)
        )
        return response["result"][0]

    def get_newsletter_subscription(self, lead_id):
        response = self.request(
            method="GET",
            url=LEAD_NEWSLETTER_SUBSCRIPTION,
            url_args=dict(lead_id=lead_id),
        )
        return response["result"][0] if "result" in response else {}

    def set_newsletter_subscription(self, lead_email, newsletter_status):
        payload = {
            "action": "updateOnly",
            "asyncProcessing": False,
            "input": [
                {
                    "email": lead_email,
                    "snapcraftnewsletter": True
                    if newsletter_status
                    else False,
                }
            ],
        }

        response = self.request(method="POST", url=LEADS, json=payload)
        return response
