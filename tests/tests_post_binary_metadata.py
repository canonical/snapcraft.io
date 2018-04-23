import unittest
import responses
import json
import io
from tests.endpoint_testing import BaseTestCases


class PostBinaryMetadataListingPage(BaseTestCases.BaseAppTesting):
    def setUp(self):
        self.snap_id = 'complexId'
        snap_name = "test-snap"
        endpoint_url = '/account/snaps/{}/listing'.format(snap_name)

        super().setUp(snap_name, None, endpoint_url)
        self.authorization = self._log_in(self.client)

    def _get_redirect(self):
        return (
            'http://localhost'
            '/account/snaps/{}/listing'
        ).format(self.snap_name)

    @responses.activate
    def test_get_binary_metadata_macaroon_refresh(self):
        api_url = (
            'https://dashboard.snapcraft.io/dev/api/'
            'snaps/{}/binary-metadata').format(
                self.snap_id)

        responses.add(
            responses.GET, api_url,
            json=[], status=500,
            headers={'WWW-Authenticate': 'Macaroon needs_refresh=1'})
        responses.add(
            responses.POST,
            'https://login.ubuntu.com/api/v2/tokens/refresh',
            json={'discharge_macaroon': 'macaroon'}, status=200)

        changes = {
            "images":  None
        }

        data = dict(
            snap_id=self.snap_id,
            changes=json.dumps(changes),
        )
        response = self.client.post(
            self.endpoint_url,
            content_type='multipart/form-data',
            data=data)

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            "GET",
            called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))
        called = responses.calls[1]
        self.assertEqual(
            'https://login.ubuntu.com/api/v2/tokens/refresh',
            called.request.url)

        assert response.status_code == 302
        assert response.location == self._get_redirect()

    @responses.activate
    def test_post_binary_metadata_macaroon_refresh(self):
        api_url = (
            'https://dashboard.snapcraft.io/dev/api/'
            'snaps/{}/binary-metadata').format(
                self.snap_id)

        responses.add(
            responses.GET, api_url,
            json=[], status=200)
        responses.add(
            responses.PUT, api_url,
            json={}, status=500,
            headers={'WWW-Authenticate': 'Macaroon needs_refresh=1'})
        responses.add(
            responses.POST,
            'https://login.ubuntu.com/api/v2/tokens/refresh',
            json={'discharge_macaroon': 'macaroon'}, status=200)

        changes = {
            "images": [
                {
                    'file': {},
                    'url': 'blob:this_is_a_blob',
                    'name': 'blue.png',
                    'type': 'screenshot',
                    'status': 'new'
                }
            ]
        }

        data = dict(
            screenshots=[(io.BytesIO(b'my file contents'), "blue.png")],
            snap_id=self.snap_id,
            changes=json.dumps(changes),
        )

        response = self.client.post(
            self.endpoint_url,
            content_type='multipart/form-data',
            data=data)

        self.assertEqual(3, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            "GET",
            called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        called = responses.calls[1]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            "PUT",
            called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertIn(
            b'"key": "blue.png"',
            called.request.body
        )
        self.assertIn(
            b'"type": "screenshot"',
            called.request.body
        )
        self.assertIn(
            b'"filename": "blue.png"',
            called.request.body
        )
        hash_screenshot = (
            '"hash": '
            '"114d70ba7d04c76d8c217c970f99682025c89b1a6ffe91eb9045653b4b954eb9'
        )
        self.assertIn(
            bytes(hash_screenshot, encoding='utf-8'),
            called.request.body
        )
        called = responses.calls[2]
        self.assertEqual(
            'https://login.ubuntu.com/api/v2/tokens/refresh',
            called.request.url)

        assert response.status_code == 302
        assert response.location == self._get_redirect()

    @responses.activate
    def test_upload_new_screenshot(self):
        api_url = (
            'https://dashboard.snapcraft.io/dev/api/'
            'snaps/{}/binary-metadata').format(
                self.snap_id)

        responses.add(
            responses.GET, api_url,
            json=[], status=200)
        responses.add(
            responses.PUT, api_url,
            json={}, status=200)

        changes = {
            "images": [
                {
                    'file': {},
                    'url': 'blob:this_is_a_blob',
                    'name': 'blue.png',
                    'type': 'screenshot',
                    'status': 'new'
                }
            ]
        }

        data = dict(
            screenshots=[(io.BytesIO(b'my file contents'), "blue.png")],
            snap_id=self.snap_id,
            changes=json.dumps(changes),
        )

        response = self.client.post(
            self.endpoint_url,
            content_type='multipart/form-data',
            data=data)

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            "GET",
            called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        called = responses.calls[1]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            "PUT",
            called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertIn(
            b'"key": "blue.png"',
            called.request.body
        )
        self.assertIn(
            b'"type": "screenshot"',
            called.request.body
        )
        self.assertIn(
            b'"filename": "blue.png"',
            called.request.body
        )
        hash_screenshot = (
            '"hash": '
            '"114d70ba7d04c76d8c217c970f99682025c89b1a6ffe91eb9045653b4b954eb9'
        )
        self.assertIn(
            bytes(hash_screenshot, encoding='utf-8'),
            called.request.body
        )

        assert response.status_code == 302
        assert response.location == self._get_redirect()

    @responses.activate
    def test_upload_new_icon(self):
        api_url = (
            'https://dashboard.snapcraft.io/dev/api/'
            'snaps/{}/binary-metadata').format(
                self.snap_id)

        responses.add(
            responses.GET, api_url,
            json=[], status=200)
        responses.add(
            responses.PUT, api_url,
            json={}, status=200)

        changes = {
            "images": [
                {
                    'file': {},
                    'url': 'blob:this_is_a_blob',
                    'name': 'blue.png',
                    'type': 'icon',
                    'status': 'new'
                }
            ]
        }

        data = dict(
            icon=[(io.BytesIO(b'my file contents'), "blue.png")],
            snap_id=self.snap_id,
            changes=json.dumps(changes),
        )

        response = self.client.post(
            self.endpoint_url,
            content_type='multipart/form-data',
            data=data)

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            "GET",
            called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        called = responses.calls[1]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            "PUT",
            called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertIn(
            b'"key": "blue.png"',
            called.request.body
        )
        self.assertIn(
            b'"type": "icon"',
            called.request.body
        )
        self.assertIn(
            b'"filename": "blue.png"',
            called.request.body
        )
        hash_screenshot = (
            '"hash": '
            '"114d70ba7d04c76d8c217c970f99682025c89b1a6ffe91eb9045653b4b954eb9'
        )
        self.assertIn(
            bytes(hash_screenshot, encoding='utf-8'),
            called.request.body
        )

        assert response.status_code == 302
        assert response.location == self._get_redirect()

    @responses.activate
    def test_upload_new_screenshot_with_existing_ones(self):
        api_url = (
            'https://dashboard.snapcraft.io/dev/api/'
            'snaps/{}/binary-metadata').format(
                self.snap_id)

        current_screenshots = [
            {
                'url': 'URL',
                'hash': 'HASH',
                'type': 'screenshot',
                'filename': 'red.png'
            }
        ]
        responses.add(
            responses.GET, api_url,
            json=current_screenshots, status=200)
        responses.add(
            responses.PUT, api_url,
            json={}, status=200)

        changes = {
            "images": [
                {
                    'file': {},
                    'url': 'blob:this_is_a_blob',
                    'name': 'blue.png',
                    'type': 'icon',
                    'status': 'new'
                },
                {
                    'url': 'URL',
                    'type': 'screenshot',
                    'status': 'uploaded'
                }

            ]
        }

        data = dict(
            screenshots=[(io.BytesIO(b'my file contents'), "blue.png")],
            snap_id=self.snap_id,
            changes=json.dumps(changes),
        )

        response = self.client.post(
            self.endpoint_url,
            content_type='multipart/form-data',
            data=data)

        self.assertEqual(2, len(responses.calls))
        called = responses.calls[0]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            "GET",
            called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        called = responses.calls[1]
        self.assertEqual(
            api_url,
            called.request.url)
        self.assertEqual(
            "PUT",
            called.request.method)
        self.assertEqual(
            self.authorization, called.request.headers.get('Authorization'))

        self.assertIn(
            b'"key": "blue.png"',
            called.request.body
        )
        self.assertIn(
            b'"type": "screenshot"',
            called.request.body
        )
        self.assertIn(
            b'"filename": "blue.png"',
            called.request.body
        )
        hash_screenshot = (
            '"hash": '
            '"114d70ba7d04c76d8c217c970f99682025c89b1a6ffe91eb9045653b4b954eb9'
        )
        self.assertIn(
            bytes(hash_screenshot, encoding='utf-8'),
            called.request.body
        )

        self.assertIn(
            b'"url": "URL"',
            called.request.body
        )
        self.assertIn(
            b'"hash": "HASH"',
            called.request.body
        )
        self.assertIn(
            b'"type": "screenshot"',
            called.request.body
        )
        self.assertIn(
            b'"filename": "red.png"',
            called.request.body
        )

        assert response.status_code == 302
        assert response.location == self._get_redirect()


if __name__ == '__main__':
    unittest.main()
