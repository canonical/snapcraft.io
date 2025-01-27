import random
from datetime import datetime
from flask_testing import TestCase
from webapp.app import create_app
from unittest.mock import patch

import responses
from tests.publisher.endpoint_testing import BaseTestCases


class MetricsPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = "/{}/metrics".format(snap_name)

        super().setUp(snap_name=snap_name, endpoint_url=endpoint_url)


class GetActiveDeviceAnnotationGetInfo(
    BaseTestCases.EndpointLoggedInErrorHandling
):
    def setUp(self):
        snap_name = "test-snap"

        api_url = "https://dashboard.snapcraft.io/dev/api/snaps/info/{}"
        api_url = api_url.format(snap_name)
        endpoint_url = "/{}/metrics/active-device-annotation".format(snap_name)
        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint="GET",
            api_url=api_url,
            method_api="GET",
        )


class GetActiveDeviceMetrics(TestCase):
    render_templates = False

    snap_name = "test-snap"
    endpoint_url = "/test-snap/metrics/active-devices"

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []
        return app

    @responses.activate
    @patch("webapp.publisher.snaps.views.authentication.is_authenticated")
    @patch(
        "canonicalwebteam.store_api.stores."
        "snapstore.SnapPublisher.get_snap_info"
    )
    @patch(
        "canonicalwebteam.store_api.stores."
        "snapstore.SnapPublisher.get_publisher_metrics"
    )
    def test_get_active_devices_weekly_installed_by_version(
        self,
        mock_get_publisher_metrics,
        mock_get_item_details,
        mock_is_authenticated,
    ):
        mock_is_authenticated.return_value = True

        mock_get_item_details.return_value = {"snap_id": "id"}
        random_values = random.sample(range(1, 30), 29)
        dates = [
            datetime(2018, 3, day).strftime("%Y-%m-%d") for day in range(1, 30)
        ]

        mock_get_publisher_metrics.return_value = {
            "metrics": [
                {
                    "buckets": dates,
                    "metric_name": "weekly_installed_base_by_version",
                    "series": [{"name": "1.0", "values": random_values}],
                    "snap_id": "test-id",
                    "status": "OK",
                }
            ]
        }

        response = self.client.get(self.endpoint_url)
        self.assertEqual(response.status_code, 200)
        response_json = response.json

        self.assertIn("active_devices", response_json)
        self.assertIn("latest_active_devices", response_json)
        self.assertEqual(
            response_json["latest_active_devices"], random_values[28]
        )

        active_devices = response_json["active_devices"]
        self.assertEqual(
            active_devices["name"], "weekly_installed_base_by_version"
        )
        self.assertEqual(active_devices["series"][0]["name"], "1.0")
        self.assertEqual(active_devices["series"][0]["values"], random_values)

    @responses.activate
    @patch("webapp.publisher.snaps.views.authentication.is_authenticated")
    @patch(
        "canonicalwebteam.store_api.stores."
        "snapstore.SnapPublisher.get_snap_info"
    )
    @patch(
        "canonicalwebteam.store_api.stores."
        "snapstore.SnapPublisher.get_publisher_metrics"
    )
    def test_get_active_devices_weekly_installed_by_channel(
        self,
        mock_get_publisher_metrics,
        mock_get_item_details,
        mock_is_authenticated,
    ):
        mock_is_authenticated.return_value = True
        mock_get_item_details.return_value = {"snap_id": "id"}
        random_values = random.sample(range(1, 30), 29)
        dates = [
            datetime(2018, 3, day).strftime("%Y-%m-%d") for day in range(1, 30)
        ]
        mock_get_publisher_metrics.return_value = {
            "metrics": [
                {
                    "buckets": dates,
                    "metric_name": "weekly_installed_base_by_channel",
                    "series": [{"name": "1.0", "values": random_values}],
                    "snap_id": "test-id",
                    "status": "OK",
                }
            ]
        }

        response = self.client.get(
            self.endpoint_url + "?active-devices=channel"
        )
        self.assertEqual(response.status_code, 200)
        response_json = response.json
        self.assertIn("active_devices", response_json)
        self.assertIn("latest_active_devices", response_json)
        self.assertEqual(
            response_json["latest_active_devices"], random_values[28]
        )

        active_devices = response_json["active_devices"]
        self.assertEqual(
            active_devices["name"], "weekly_installed_base_by_channel"
        )
        self.assertEqual(active_devices["series"][0]["name"], "latest/1.0")
        self.assertEqual(active_devices["series"][0]["values"], random_values)

    @responses.activate
    @patch("webapp.publisher.snaps.views.authentication.is_authenticated")
    @patch(
        "canonicalwebteam.store_api.stores."
        "snapstore.SnapPublisher.get_snap_info"
    )
    @patch(
        "canonicalwebteam.store_api.stores."
        "snapstore.SnapPublisher.get_publisher_metrics"
    )
    def test_get_active_devices_weekly_installed_by_os(
        self,
        mock_get_publisher_metrics,
        mock_get_item_details,
        mock_is_authenticated,
    ):
        mock_is_authenticated.return_value = True
        mock_get_item_details.return_value = {"snap_id": "id"}
        random_values = random.sample(range(1, 30), 29)
        dates = [
            datetime(2018, 3, day).strftime("%Y-%m-%d") for day in range(1, 30)
        ]
        mock_get_publisher_metrics.return_value = {
            "metrics": [
                {
                    "buckets": dates,
                    "metric_name": "weekly_installed_base_by_operating_system",
                    "series": [
                        {"values": random_values, "name": "ubuntu/0.1"}
                    ],
                    "snap_id": "test-id",
                    "status": "OK",
                }
            ]
        }

        response = self.client.get(self.endpoint_url + "?active-devices=os")
        self.assertEqual(response.status_code, 200)
        response_json = response.json
        self.assertIn("active_devices", response_json)
        self.assertIn("latest_active_devices", response_json)

        active_devices = response_json["active_devices"]
        self.assertEqual(
            active_devices["name"], "weekly_installed_base_by_operating_system"
        )
        self.assertEqual(active_devices["series"][0]["name"], "Ubuntu 0.1")
        self.assertEqual(active_devices["series"][0]["values"], random_values)

    @responses.activate
    @patch("webapp.publisher.snaps.views.authentication.is_authenticated")
    @patch(
        "canonicalwebteam.store_api.stores."
        "snapstore.SnapPublisher.get_snap_info"
    )
    @patch(
        "canonicalwebteam.store_api.stores."
        "snapstore.SnapPublisher.get_publisher_metrics"
    )
    def test_get_active_devices_in_3_months_period(
        self,
        mock_get_publisher_metrics,
        mock_get_item_details,
        mock_is_authenticated,
    ):
        mock_is_authenticated.return_value = True
        mock_get_item_details.return_value = {"snap_id": "id"}
        random_values = random.sample(range(1, 30), 29)
        dates = [
            datetime(2018, 3, day).strftime("%Y-%m-%d") for day in range(1, 30)
        ]
        mock_get_publisher_metrics.return_value = {
            "metrics": [
                {
                    "buckets": dates,
                    "metric_name": "weekly_installed_base_by_architecture",
                    "series": [{"values": random_values, "name": "0.1"}],
                    "snap_id": "test-id",
                    "status": "OK",
                }
            ]
        }

        response = self.client.get(
            self.endpoint_url + "?active-devices=architecture&period=3m"
        )
        self.assertEqual(response.status_code, 200)
        response_json = response.json

        self.assertIn("active_devices", response_json)
        self.assertIn("latest_active_devices", response_json)

        active_devices = response_json["active_devices"]
        self.assertEqual(
            active_devices["name"], "weekly_installed_base_by_architecture"
        )
        self.assertEqual(active_devices["series"][0]["name"], "0.1")
        self.assertEqual(active_devices["series"][0]["values"], random_values)


class GetMetricAnnotation(TestCase):
    render_templates = False

    snap_name = "test-snap"
    snap_payload = {
        "snap_name": snap_name,
        "snap_id": "snap_id",
        "categories": {
            "locked": False,
            "items": [
                {
                    "featured": False,
                    "name": "development",
                    "since": "2019-02-08T17:02:33.318798",
                },
                {
                    "featured": True,
                    "name": "featured",
                    "since": "2024-07-01T19:45:19.386538",
                },
                {
                    "featured": True,
                    "name": "server-and-cloud",
                    "since": "2019-01-24T10:26:40.642290",
                },
            ],
        },
    }
    endpoint_url = "/test-snap/metrics/active-device-annotation"

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []
        return app

    @responses.activate
    @patch("webapp.publisher.snaps.views.authentication.is_authenticated")
    @patch(
        "canonicalwebteam.store_api.stores."
        "snapstore.SnapPublisher.get_snap_info"
    )
    def test_get_active_devices_weekly_installed_by_version(
        self, mock_get_snap_info, mock_is_authenticated
    ):
        mock_is_authenticated.return_value = True

        mock_get_snap_info.return_value = self.snap_payload

        response = self.client.get(self.endpoint_url)
        self.assertEqual(response.status_code, 200)
        response_json = response.json

        self.assertEqual(
            response_json["buckets"],
            ["2019-02-08", "2024-07-01", "2019-01-24"],
        )
        self.assertEqual(response_json["name"], "annotations")
        self.assertEqual(
            response_json["series"],
            [
                {
                    "date": "2019-01-24",
                    "display_date": "January 2019",
                    "display_name": "Server and cloud",
                    "name": "server-and-cloud",
                    "values": [0, 0, 1],
                },
                {
                    "date": "2019-02-08",
                    "display_date": "February 2019",
                    "display_name": "Development",
                    "name": "development",
                    "values": [1, 0, 0],
                },
                {
                    "date": "2024-07-01",
                    "display_date": "July 2024",
                    "display_name": "Featured",
                    "name": "featured",
                    "values": [0, 1, 0],
                },
            ],
        )


class GetCountryMetric(TestCase):
    render_templates = False

    snap_name = "test-snap"
    endpoint_url = "/test-snap/metrics/country-metric"

    def create_app(self):
        app = create_app(testing=True)
        app.secret_key = "secret_key"
        app.config["WTF_CSRF_METHODS"] = []
        return app

    @responses.activate
    @patch("webapp.publisher.snaps.views.authentication.is_authenticated")
    @patch(
        "canonicalwebteam.store_api.stores."
        "snapstore.SnapPublisher.get_snap_info"
    )
    @patch(
        "canonicalwebteam.store_api.stores."
        "snapstore.SnapPublisher.get_publisher_metrics"
    )
    def test_get_active_devices_weekly_installed_by_version(
        self,
        mock_get_publisher_metrics,
        mock_get_item_details,
        mock_is_authenticated,
    ):

        mock_is_authenticated.return_value = True

        countries = [
            {"values": [2], "name": "FR"},
            {"values": [3], "name": "GB"},
        ]
        mock_get_item_details.return_value = {"snap_id": "id"}
        mock_get_publisher_metrics.return_value = {
            "metrics": [
                {
                    "buckets": ["2024-09-17"],
                    "metric_name": "weekly_installed_base_by_country",
                    "series": countries,
                    "snap_id": "id",
                    "status": "OK",
                }
            ]
        }

        response = self.client.get(self.endpoint_url)
        self.assertEqual(response.status_code, 200)
        response_json = response.json
        active_devices = response_json["active_devices"]

        for info in active_devices:
            country_info = active_devices[info]
            if country_info["code"] == "FR":
                self.assertEqual(country_info["number_of_users"], 2)
                self.assertEqual(country_info["color_rgb"], [66, 146, 198])
            elif country_info["code"] == "GB":
                self.assertEqual(country_info["number_of_users"], 3)
                self.assertEqual(country_info["color_rgb"], [8, 48, 107])
            else:
                self.assertEqual(country_info["number_of_users"], 0)
                self.assertEqual(country_info["color_rgb"], [218, 218, 218])
