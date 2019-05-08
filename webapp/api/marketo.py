import os

from webapp import api
from webapp.api.exceptions import (
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList,
)

MARKETO_URL = os.getenv("MARKETO_URL", "")
MARKETO_CLIENT_ID = os.getenv("MARKETO_CLIENT_ID", "")
MARKETO_CLIENT_SECRET = os.getenv("MARKETO_CLIENT_SECRET", "")

AUTH_URL = "".join(
    [
        MARKETO_URL,
        "identity/oauth/token?grant_type=client_credentials&client_id=",
        MARKETO_CLIENT_ID,
        "&client_secret=",
        MARKETO_CLIENT_SECRET,
    ]
)

LEAD_BY_EMAIL = "".join(
    [
        MARKETO_URL,
        "rest/v1/leads.json?access_token={token}",
        "&filterType=email&filterValues={email}&fields=id",
    ]
)

LEAD_NEWSLETTER_SUBSCRIPTION = "".join(
    [
        MARKETO_URL,
        "rest/v1/",
        "lead/{lead_id}.json?access_token={token}",
        "&fields=id,email,snapcraftnewsletter",
    ]
)


class MarketoApi:
    api_session = api.requests.Session(timeout=(1, 6))
    token = ""

    def __init__(self):
        self.authenticate()

    def process_response(self, response):
        try:
            body = response.json()
        except ValueError as decode_error:
            api_error_exception = ApiResponseDecodeError(
                "JSON decoding failed: {}".format(decode_error)
            )
            raise api_error_exception

        if not response.ok:
            if "success" in body and body["success"] is False:
                api_error_exception = ApiResponseErrorList(
                    "The api returned a list of errors",
                    body["errors"][0]["code"],
                    map(lambda error: error["message"], body["errors"]),
                )

                raise api_error_exception
            else:
                raise ApiResponseError("Unknown error from api", 500)

        return body

    def authenticate(self):
        auth_request = self.api_session.get(AUTH_URL)
        response = self.process_response(auth_request)

        self.token = response["access_token"]

    def get_user(self, email):
        lead_request = self.api_session.get(
            LEAD_BY_EMAIL.format(token=self.token, email=email)
        )
        response = self.process_response(lead_request)
        print(response)
        return response["result"][0]

    def get_newsletter_subscription(self, lead_id):
        subscription_request = self.api_session.get(
            LEAD_NEWSLETTER_SUBSCRIPTION.format(
                token=self.token, lead_id=lead_id
            )
        )
        response = self.process_response(subscription_request)
        return response["result"][0]
