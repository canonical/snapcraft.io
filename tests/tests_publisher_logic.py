import unittest
import modules.publisher.logic as logic


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
                        'latest_revisions': 'revision'
                    }
                }
            }
        }
        user_snaps, registered_snaps = logic.get_snaps_account_info(
            account_info)

        expected_user_snaps = {
            'snap1': {
                'latest_revisions': 'revision'
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
                        'latest_revisions': 'revision'
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
                'latest_revisions': 'revision'
            }
        }
        expected_registered_snaps = {
            'snap2': {
                'latest_revisions': None
            }
        }

        self.assertEqual(user_snaps, expected_user_snaps)
        self.assertEqual(registered_snaps, expected_registered_snaps)
