import unittest

import datetime
from freezegun import freeze_time
from webapp.publisher.snaps import logic


class PublisherLogicTest(unittest.TestCase):

    # get_snaps_account_info
    # ===
    def test_empty_snaps(self):
        account_info = {"snaps": {}}
        user_snaps, registered_snaps = logic.get_snaps_account_info(
            account_info
        )

        self.assertEqual(user_snaps, {})
        self.assertEqual(registered_snaps, {})

    def test_only_uploaded_snaps(self):
        account_info = {
            "snaps": {
                "16": {
                    "snap1": {
                        "status": "Approved",
                        "latest_revisions": [
                            {"since": "2018-01-01T00:00:00Z", "channels": []}
                        ],
                    }
                }
            }
        }
        user_snaps, registered_snaps = logic.get_snaps_account_info(
            account_info
        )

        expected_user_snaps = {
            "snap1": {
                "status": "Approved",
                "latest_revisions": [
                    {"since": "2018-01-01T00:00:00Z", "channels": []}
                ],
            }
        }

        self.assertEqual(user_snaps, expected_user_snaps)
        self.assertEqual(registered_snaps, {})

    def test_only_registred_snaps(self):
        account_info = {
            "snaps": {
                "16": {
                    "snap1": {"status": "Approved", "latest_revisions": None}
                }
            }
        }
        user_snaps, registered_snaps = logic.get_snaps_account_info(
            account_info
        )

        expected_registered_snaps = {
            "snap1": {"status": "Approved", "latest_revisions": None}
        }

        self.assertEqual(user_snaps, {})
        self.assertEqual(registered_snaps, expected_registered_snaps)

    def test_all_snaps(self):
        account_info = {
            "snaps": {
                "16": {
                    "snap1": {
                        "status": "Approved",
                        "latest_revisions": [
                            {"since": "2018-01-01T00:00:00Z", "channels": []}
                        ],
                    },
                    "snap2": {"status": "Approved", "latest_revisions": None},
                }
            }
        }
        user_snaps, registered_snaps = logic.get_snaps_account_info(
            account_info
        )

        expected_user_snaps = {
            "snap1": {
                "status": "Approved",
                "latest_revisions": [
                    {"since": "2018-01-01T00:00:00Z", "channels": []}
                ],
            }
        }
        expected_registered_snaps = {
            "snap2": {"status": "Approved", "latest_revisions": None}
        }

        self.assertEqual(user_snaps, expected_user_snaps)
        self.assertEqual(registered_snaps, expected_registered_snaps)

    # is_snap_on_stable
    # ===
    def test_snap_not_stable(self):
        channel_maps_list = [
            {"map": [{"channel": "not stable", "info": None}]}
        ]

        result = logic.is_snap_on_stable(channel_maps_list)
        self.assertFalse(result)

    def test_snap_stable_not_info(self):
        channel_maps_list = [{"map": [{"channel": "stable", "info": None}]}]

        result = logic.is_snap_on_stable(channel_maps_list)
        self.assertFalse(result)

    def test_snap_stable(self):
        channel_maps_list = [{"map": [{"channel": "stable", "info": "info"}]}]

        result = logic.is_snap_on_stable(channel_maps_list)
        self.assertTrue(result)

    def test_convert_date_more_than_yesterday(self):
        date_test = "2019-01-12T16:48:41.821037+00:00"
        result = logic.convert_date(date_test)

        self.assertEqual(result, "12 January 2019")

    def test_convert_date_more_today(self):
        date_test = datetime.datetime.now().strftime("%Y-%m-%d")
        result = logic.convert_date(date_test)

        self.assertEqual(result, "Today")

    @freeze_time("2021-05-12 10:38:34", tz_offset=-6)
    def test_convert_date_timezone_yesterday(self):
        date_test = "2021-05-11T16:48:41.821037+06:00"
        result = logic.convert_date(date_test)

        self.assertEqual(result, "Make it fail")
