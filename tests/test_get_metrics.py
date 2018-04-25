from datetime import datetime
import random
import responses

from tests.endpoint_testing import BaseTestCases


class MetricsPageNotAuth(BaseTestCases.EndpointLoggedOut):
    def setUp(self):
        snap_name = "test-snap"
        endpoint_url = '/account/snaps/{}/metrics'.format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url)


class GetMetricsGetInfoPage(
        BaseTestCases.EndpointLoggedInErrorHandling):
    def setUp(self):
        snap_name = "test-snap"

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        api_url = api_url.format(
            snap_name
        )
        endpoint_url = '/account/snaps/{}/metrics'.format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            method_endpoint='GET',
            api_url=api_url,
            method_api='GET'
        )


class GetMetricsPostMetrics(
        BaseTestCases.EndpointLoggedInErrorHandling):

    def setUp(self):
        snap_name = "test-snap"

        self.snap_id = 'complexId'
        info_url = 'https://dashboard.snapcraft.io/dev/api/snaps/info/{}'
        self.info_url = info_url.format(
            snap_name
        )

        payload = {
            'snap_id': 'id',
            'title': 'Test Snap'
        }

        responses.add(
            responses.GET, self.info_url,
            json=payload, status=200)

        api_url = 'https://dashboard.snapcraft.io/dev/api/snaps/metrics'
        endpoint_url = '/account/snaps/{}/metrics'.format(snap_name)

        super().setUp(
            snap_name=snap_name,
            endpoint_url=endpoint_url,
            api_url=api_url,
            method_endpoint='GET',
            method_api='POST'
        )

    @responses.activate
    def test_no_data(self):
        payload = {
            'metrics': [
                {
                    'status': 'NO DATA',
                    'series': [],
                    'buckets': [],
                    'metric_name': 'weekly_installed_base_by_version'
                },
                {
                    'status': 'NO DATA',
                    'series': [],
                    'buckets': [],
                    'metric_name': 'weekly_installed_base_by_country'
                }
            ]
        }

        responses.add(
            responses.POST, self.api_url,
            json=payload, status=200)

        response = self.client.get(
            self.endpoint_url,
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.info_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))
        called = responses.calls[1]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertEqual(response.status_code, 200)
        self.assert_template_used('publisher/metrics.html')
        self.assert_context('snap_name', self.snap_name)
        self.assert_context('snap_title', 'Test Snap')
        self.assert_context('metric_period', '30d')
        self.assert_context('active_device_metric', 'version')
        self.assert_context('nodata', True)

    @responses.activate
    def test_data_version_1_month(self):
        random_values = random.sample(range(1, 30), 29)
        dates = [
            datetime(2018, 3, day).strftime("%Y-%m-%d")
            for day in range(1, 30)
        ]
        coutries = [
            {'values': [2], 'name': 'FR'},
            {'values': [3], 'name': 'GB'}
        ]
        payload = {
            'metrics': [
                {
                    'status': 'OK',
                    'series': [
                        {
                            'values': random_values,
                            'name': '0.1'
                        }
                    ],
                    'buckets': dates,
                    'metric_name': 'weekly_installed_base_by_version'
                },
                {
                    'status': 'OK',
                    'series': coutries,
                    'buckets': ['2018-03-18'],
                    'metric_name': 'weekly_installed_base_by_country'
                }
            ]
        }
        responses.add(
            responses.POST, self.api_url,
            json=payload, status=200)

        response = self.client.get(
            self.endpoint_url + '?period=30d',
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.info_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))
        called = responses.calls[1]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertEqual(response.status_code, 200)
        self.assert_template_used('publisher/metrics.html')
        self.assert_context('snap_name', self.snap_name)
        self.assert_context('snap_title', 'Test Snap')
        self.assert_context('metric_period', '30d')
        self.assert_context('active_device_metric', 'version')
        self.assert_context('nodata', False)

    @responses.activate
    def test_data_version_weekly(self):
        random_values = random.sample(range(1, 30), 6)
        dates = [
            datetime(2018, 3, day).strftime("%Y-%m-%d")
            for day in range(1, 7)
        ]
        coutries = [
            {'values': [2], 'name': 'FR'},
            {'values': [3], 'name': 'GB'}
        ]
        payload = {
            'metrics': [
                {
                    'status': 'OK',
                    'series': [
                        {
                            'values': random_values,
                            'name': '0.1'
                        }
                    ],
                    'buckets': dates,
                    'metric_name': 'weekly_installed_base_by_version'
                },
                {
                    'status': 'OK',
                    'series': coutries,
                    'buckets': ['2018-03-18'],
                    'metric_name': 'weekly_installed_base_by_country'
                }
            ]
        }
        responses.add(
            responses.POST, self.api_url,
            json=payload, status=200)

        response = self.client.get(
            self.endpoint_url + '?period=7d',
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.info_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))
        called = responses.calls[1]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertEqual(response.status_code, 200)
        self.assert_template_used('publisher/metrics.html')
        self.assert_context('snap_name', self.snap_name)
        self.assert_context('snap_title', 'Test Snap')
        self.assert_context('metric_period', '7d')
        self.assert_context('active_device_metric', 'version')
        self.assert_context('nodata', False)

    @responses.activate
    def test_data_version_3_month(self):
        random_values = random.sample(range(1, 100), 59)
        dates = []
        for month in range(4, 7):
            dates = dates + [
                    datetime(2018, month, day).strftime("%Y-%m-%d")
                    for day in range(1, 30)
                ]

        coutries = [
            {'values': [2], 'name': 'FR'},
            {'values': [3], 'name': 'GB'}
        ]
        payload = {
            'metrics': [
                {
                    'status': 'OK',
                    'series': [
                        {
                            'values': random_values,
                            'name': '0.1'
                        }
                    ],
                    'buckets': dates,
                    'metric_name': 'weekly_installed_base_by_version'
                },
                {
                    'status': 'OK',
                    'series': coutries,
                    'buckets': ['2018-03-18'],
                    'metric_name': 'weekly_installed_base_by_country'
                }
            ]
        }
        responses.add(
            responses.POST, self.api_url,
            json=payload, status=200)

        response = self.client.get(
            self.endpoint_url + '?period=3m',
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.info_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))
        called = responses.calls[1]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertEqual(response.status_code, 200)
        self.assert_template_used('publisher/metrics.html')
        self.assert_context('snap_name', self.snap_name)
        self.assert_context('snap_title', 'Test Snap')
        self.assert_context('metric_period', '3m')
        self.assert_context('active_device_metric', 'version')
        self.assert_context('nodata', False)

    @responses.activate
    def test_data_os_7_days(self):
        random_values = random.sample(range(1, 100), 59)
        dates = [
            datetime(2018, 3, day).strftime("%Y-%m-%d")
            for day in range(1, 7)
        ]
        coutries = [
            {'values': [2], 'name': 'FR'},
            {'values': [3], 'name': 'GB'}
        ]
        payload = {
            'metrics': [
                {
                    'status': 'OK',
                    'series': [
                        {
                            'values': random_values,
                            'name': '0.1'
                        }
                    ],
                    'buckets': dates,
                    'metric_name': 'weekly_installed_base_by_operating_system'
                },
                {
                    'status': 'OK',
                    'series': coutries,
                    'buckets': ['2018-03-18'],
                    'metric_name': 'weekly_installed_base_by_country'
                }
            ]
        }
        responses.add(
            responses.POST, self.api_url,
            json=payload, status=200)

        response = self.client.get(
            self.endpoint_url + '?period=7d&active-devices=os',
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.info_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))
        called = responses.calls[1]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertEqual(response.status_code, 200)
        self.assert_template_used('publisher/metrics.html')
        self.assert_context('snap_name', self.snap_name)
        self.assert_context('snap_title', 'Test Snap')
        self.assert_context('metric_period', '7d')
        self.assert_context('active_device_metric', 'os')
        self.assert_context('nodata', False)

    @responses.activate
    def test_data_os_1_month(self):
        random_values = random.sample(range(1, 100), 59)
        dates = [
            datetime(2018, 3, day).strftime("%Y-%m-%d")
            for day in range(1, 30)
        ]
        coutries = [
            {'values': [2], 'name': 'FR'},
            {'values': [3], 'name': 'GB'}
        ]
        payload = {
            'metrics': [
                {
                    'status': 'OK',
                    'series': [
                        {
                            'values': random_values,
                            'name': '0.1'
                        }
                    ],
                    'buckets': dates,
                    'metric_name': 'weekly_installed_base_by_operating_system'
                },
                {
                    'status': 'OK',
                    'series': coutries,
                    'buckets': ['2018-03-18'],
                    'metric_name': 'weekly_installed_base_by_country'
                }
            ]
        }
        responses.add(
            responses.POST, self.api_url,
            json=payload, status=200)

        response = self.client.get(
            self.endpoint_url + '?period=30d&active-devices=os',
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.info_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))
        called = responses.calls[1]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertEqual(response.status_code, 200)
        self.assert_template_used('publisher/metrics.html')
        self.assert_context('snap_name', self.snap_name)
        self.assert_context('snap_title', 'Test Snap')
        self.assert_context('metric_period', '30d')
        self.assert_context('active_device_metric', 'os')
        self.assert_context('nodata', False)

    @responses.activate
    def test_data_os_3_month(self):
        random_values = random.sample(range(1, 100), 59)
        dates = []
        for month in range(4, 7):
            dates = dates + [
                    datetime(2018, month, day).strftime("%Y-%m-%d")
                    for day in range(1, 30)
                ]

        coutries = [
            {'values': [2], 'name': 'FR'},
            {'values': [3], 'name': 'GB'}
        ]
        payload = {
            'metrics': [
                {
                    'status': 'OK',
                    'series': [
                        {
                            'values': random_values,
                            'name': '0.1'
                        }
                    ],
                    'buckets': dates,
                    'metric_name': 'weekly_installed_base_by_operating_system'
                },
                {
                    'status': 'OK',
                    'series': coutries,
                    'buckets': ['2018-03-18'],
                    'metric_name': 'weekly_installed_base_by_country'
                }
            ]
        }
        responses.add(
            responses.POST, self.api_url,
            json=payload, status=200)

        response = self.client.get(
            self.endpoint_url + '?period=3m&active-devices=os',
        )

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            self.info_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))
        called = responses.calls[1]
        self.assertEqual(
            self.api_url,
            called.request.url)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertEqual(response.status_code, 200)
        self.assert_template_used('publisher/metrics.html')
        self.assert_context('snap_name', self.snap_name)
        self.assert_context('snap_title', 'Test Snap')
        self.assert_context('metric_period', '3m')
        self.assert_context('active_device_metric', 'os')
        self.assert_context('nodata', False)
