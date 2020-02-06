from os import getenv
from vcr_unittest import VCRTestCase
from webapp.api.launchpad import Launchpad


class LaunchapdAPITest(VCRTestCase):
    def _get_vcr_kwargs(self):
        """
        This removes the authorization header
        from VCR so we don't record auth parameters
        """
        return {"filter_headers": ["Authorization"]}

    def setUp(self):
        self.client = Launchpad(
            username=getenv("TESTS_LP_API_USERNAME", "secret"),
            token=getenv("TESTS_LP_API_TOKEN", "secret"),
            signature=getenv("TESTS_LP_API_TOKEN_SECRET", "secret"),
        )
        return super(LaunchapdAPITest, self).setUp()

    def test_get_snap_by_store_name(self):
        snap = self.client.get_snap_by_store_name("toto")
        self.assertEqual("toto", snap["store_name"])

        snap = self.client.get_snap_by_store_name("snap-that-does-not-exist")
        self.assertEqual(None, snap)

    def test_new_snap(self):
        snap_name = "new-test-snap"
        git_repo = "https://github.com/build-staging-snapcraft-io/test1"
        self.client.new_snap(snap_name, git_repo)

        # Check that the snap exist
        new_snap = self.client.get_snap_by_store_name("new-test-snap")
        self.assertEqual(git_repo, new_snap["git_repository_url"])

    def test_trigger_build(self):
        result = self.client.trigger_build("toto")
        self.assertEqual(True, result)
