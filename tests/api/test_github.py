from os import getenv
from vcr_unittest import VCRTestCase
from webapp.api.github import GitHub
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
            "build-staging-snapcraft-io", "test1", ["admin", "write"]
        )
        self.assertEqual(True, case1)

        # The user doesn't have permissions for this repo
        case2 = self.client.check_permissions_over_repo(
            "canonical-web-and-design", "snapcraft.io", ["write"]
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

    def test_get_snapcraft_yaml_name(self):
        case1 = self.client.get_snapcraft_yaml_name(
            "build-staging-snapcraft-io", "test1"
        )
        self.assertEqual("test1", case1)

        case2 = self.client.get_snapcraft_yaml_name(
            "build-staging-snapcraft-io", "test5"
        )
        self.assertEqual(False, case2)
