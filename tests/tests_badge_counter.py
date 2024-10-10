from flask_testing import TestCase
from webapp.app import create_app
from webapp.handlers import badge_counter, badge_logged_in_counter


class TestsBadgePrometheusCounter(TestCase):
    def setUp(self):
        self.endpoint_url = "/static/images/badges/en/snap-store-black.svg"
        badge_counter._value.set(0.0)
        badge_logged_in_counter._value.set(0.0)

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []

        return app

    def tests_increment_counter(self):
        self.client.get(self.endpoint_url, buffered=True)
        assert badge_counter._value.get() == 1.0

    def tests_no_increment(self):
        with self.client.session_transaction() as s:
            s["session"] = "content"

        self.client.get(self.endpoint_url, buffered=True)
        assert badge_counter._value.get() == 0.0

    def tests_increment_counter_logged_in(self):
        self.client.get(self.endpoint_url, buffered=True)
        assert badge_logged_in_counter._value.get() == 0.0

    def tests_no_increment_logged_in(self):
        with self.client.session_transaction() as s:
            s["session"] = "content"

        self.client.get(self.endpoint_url, buffered=True)
        assert badge_logged_in_counter._value.get() == 1.0
