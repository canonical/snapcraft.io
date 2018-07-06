import unittest
from webapp.publisher.snaps import logic


class PublisherLogicTest(unittest.TestCase):

    # get_snaps_account_info
    # ===
    def test_empty_snaps(self):
        account_info = {
            'snaps': {}
        }
        user_snaps, registered_snaps = logic.get_snaps_account_info(
            account_info)

        self.assertEqual(user_snaps, {})
        self.assertEqual(registered_snaps, {})

    def test_only_uploaded_snaps(self):
        account_info = {
            'snaps': {
                '16': {
                    'snap1': {
                        'latest_revisions': [
                            {
                                'since': '2018-01-01T00:00:00Z'
                            }
                        ]
                    }
                }
            }
        }
        user_snaps, registered_snaps = logic.get_snaps_account_info(
            account_info)

        expected_user_snaps = {
            'snap1': {
                'latest_revisions': [
                    {
                        'since': '2018-01-01T00:00:00Z'
                    }
                ]
            }
        }

        self.assertEqual(user_snaps, expected_user_snaps)
        self.assertEqual(registered_snaps, {})

    def test_only_registred_snaps(self):
        account_info = {
            'snaps': {
                '16': {
                    'snap1': {
                        'latest_revisions': None
                    }
                }
            }
        }
        user_snaps, registered_snaps = logic.get_snaps_account_info(
            account_info)

        expected_registered_snaps = {
            'snap1': {
                'latest_revisions': None
            }
        }

        self.assertEqual(user_snaps, {})
        self.assertEqual(registered_snaps, expected_registered_snaps)

    def test_all_snaps(self):
        account_info = {
            'snaps': {
                '16': {
                    'snap1': {
                        'latest_revisions': [
                            {
                                'since': '2018-01-01T00:00:00Z'
                            }
                        ]
                    },
                    'snap2': {
                        'latest_revisions': None
                    }
                }
            }
        }
        user_snaps, registered_snaps = logic.get_snaps_account_info(
            account_info)

        expected_user_snaps = {
            'snap1': {
                'latest_revisions': [
                    {
                        'since': '2018-01-01T00:00:00Z'
                    }
                ]
            }
        }
        expected_registered_snaps = {
            'snap2': {
                'latest_revisions': None
            }
        }

        self.assertEqual(user_snaps, expected_user_snaps)
        self.assertEqual(registered_snaps, expected_registered_snaps)

    # is_snap_on_stable
    # ===
    def test_snap_not_stable(self):
        channel_maps_list = [
            {
                'map': [
                    {
                        'channel': 'not stable',
                        'info': None
                    }
                ]
            }
        ]

        result = logic.is_snap_on_stable(channel_maps_list)
        self.assertFalse(result)

    def test_snap_stable_not_info(self):
        channel_maps_list = [
            {
                'map': [
                    {
                        'channel': 'stable',
                        'info': None
                    }
                ]
            }
        ]

        result = logic.is_snap_on_stable(channel_maps_list)
        self.assertFalse(result)

    def test_snap_stable(self):
        channel_maps_list = [
            {
                'map': [
                    {
                        'channel': 'stable',
                        'info': 'info'
                    }
                ]
            }
        ]

        result = logic.is_snap_on_stable(channel_maps_list)
        self.assertTrue(result)
