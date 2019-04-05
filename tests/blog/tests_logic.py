from unittest import TestCase

from webapp.blog import logic


class BlogLogic(TestCase):
    def test_get_tag_id_list(self):
        tags = [
            {"name": "sc:snap:test", "id": 1},
            {"name": "sc:snap:not-test", "id": 2},
            {"name": "sc:snap:test-not", "id": 3},
            {"name": "sc:snap:testnot", "id": 4},
        ]

        self.assertEqual(logic.get_tag_id_list(tags, "test"), [1])
