from os import getenv
from unittest import TestCase
from unittest.mock import MagicMock

from vcr_unittest import VCRTestCase
from webapp.api.github import GitHub, repository_is_public
from werkzeug.exceptions import Unauthorized


class GitHubTest(VCRTestCase):
    def _get_vcr_kwargs(self):
        """
        This removes the authorization header
        from VCR so we don't record auth parameters
        """
        return {"filter_headers": ["Authorization"]}

    def setUp(self):
        self.client = GitHub(getenv("TESTS_GITHUB_USER_TOKEN", "secret"))
        return super(GitHubTest, self).setUp()

    def test_get_user(self):
        user = self.client.get_user()
        self.assertIn("login", user)
        self.assertIn("name", user)
        self.assertIn("avatarUrl", user)

        # Test Unauthorized exception when using bad credentials
        self.client.access_token = "bad-token"
        self.assertRaises(Unauthorized, self.client.get_user)

    def test_get_user_repositories(self):
        repos = self.client.get_user_repositories()
        [self.assertIn("name", repo) for repo in repos]

        # Test Unauthorized exception when using bad credentials
        self.client.access_token = "bad-token"
        self.assertRaises(Unauthorized, self.client.get_user_repositories)

    def test_get_org_repositories(self):
        repos = self.client.get_org_repositories("canonical-web-and-design")
        [self.assertIn("name", repo) for repo in repos]
        [self.assertIn("nameWithOwner", repo) for repo in repos]
        [self.assertIn("owner", repo) for repo in repos]

        # Test Unauthorized exception when using bad credentials
        self.client.access_token = "bad-token"
        self.assertRaises(Unauthorized, self.client.get_user_repositories)

    def test_get_orgs(self):
        orgs = self.client.get_orgs()
        [self.assertIn("name", org) for org in orgs]
        [self.assertIn("login", org) for org in orgs]

    def test_check_permissions_over_repo(self):
        # The user is the owner of the repo
        case1 = self.client.check_permissions_over_repo(
            "build-staging-snapcraft-io", "test1"
        )
        self.assertEqual(True, case1)

        # The user doesn't have permissions for this repo
        case2 = self.client.check_permissions_over_repo(
            "canonical-web-and-design", "snapcraft.io"
        )
        self.assertEqual(False, case2)

    def test_get_snapcraft_yaml_location(self):
        # /snapcraft.yaml is present
        case1 = self.client.get_snapcraft_yaml_location(
            "build-staging-snapcraft-io", "test1"
        )
        self.assertEqual("snapcraft.yaml", case1)

        # /.snapcraft.yaml is present
        case2 = self.client.get_snapcraft_yaml_location(
            "build-staging-snapcraft-io", "test2"
        )
        self.assertEqual(".snapcraft.yaml", case2)

        # /snap/snapcraft.yaml is present
        case3 = self.client.get_snapcraft_yaml_location(
            "build-staging-snapcraft-io", "test3"
        )
        self.assertEqual("snap/snapcraft.yaml", case3)

        # /build-aux/snap/snapcraft.yaml is present
        case4 = self.client.get_snapcraft_yaml_location(
            "build-staging-snapcraft-io", "test4"
        )
        self.assertEqual("build-aux/snap/snapcraft.yaml", case4)

        # The repo doesn't contain a valid yaml file
        case5 = self.client.get_snapcraft_yaml_location(
            "build-staging-snapcraft-io", "test5"
        )
        self.assertEqual(False, case5)

    def test_get_snapcraft_yaml_data(self):
        case1 = self.client.get_snapcraft_yaml_data(
            "build-staging-snapcraft-io", "test1"
        )
        self.assertEqual("test1", case1.get("name"))

        case2 = self.client.get_snapcraft_yaml_data(
            "build-staging-snapcraft-io", "test5"
        )
        self.assertEqual(None, case2.get("name"))


class RepositoryIsPublicTest(TestCase):
    """A recipe can outlive the repository it names."""

    def _session(self, status_code=None, error=None):
        session = MagicMock()
        if error:
            session.head.side_effect = error
        else:
            session.head.return_value = MagicMock(status_code=status_code)
        return session

    def test_public_repository(self):
        self.assertTrue(
            repository_is_public("snapcrafters/mumble", self._session(200))
        )

    def test_missing_repository(self):
        self.assertFalse(repository_is_public("gone/repo", self._session(404)))

    def test_no_repository(self):
        session = self._session(200)
        self.assertTrue(repository_is_public(None, session))
        # Nothing to check, so nothing requested.
        session.head.assert_not_called()

    def test_fails_open_on_error(self):
        # A timeout must never erase provenance we hold.
        self.assertTrue(
            repository_is_public(
                "snapcrafters/mumble",
                self._session(error=Exception("read timed out")),
            )
        )

    def test_fails_open_on_rate_limit(self):
        self.assertTrue(
            repository_is_public("snapcrafters/mumble", self._session(429))
        )
