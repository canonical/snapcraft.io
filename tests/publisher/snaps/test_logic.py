import unittest

from webapp.publisher.snaps import logic


class LogicTest(unittest.TestCase):
    def test_get_snap_names_by_ownership(self):
        account_info = {
            "username": "toto",
            "snaps": {
                "16": {
                    "test": {
                        "status": "Approved",
                        "snap-id": "1",
                        "snap-name": "test",
                        "publisher": {"username": "toto"},
                        "latest_revisions": [
                            {
                                "test": "test",
                                "since": "2018-01-01T00:00:00Z",
                                "channels": [],
                            }
                        ],
                    },
                    "test2": {
                        "status": "Approved",
                        "snap-id": "2",
                        "snap-name": "test2",
                        "publisher": {"username": "titi"},
                        "latest_revisions": [
                            {
                                "test": "test",
                                "since": "2018-01-01T00:00:00Z",
                                "channels": [],
                            }
                        ],
                    },
                }
            },
        }

        owned, shared = logic.get_snap_names_by_ownership(account_info)
        self.assertListEqual(owned, ["test"])
        self.assertListEqual(shared, ["test2"])
