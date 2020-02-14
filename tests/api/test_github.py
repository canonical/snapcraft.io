from os import getenv
from vcr_unittest import VCRTestCase
from webapp.api.github import GitHubAPI
from werkzeug.exceptions import Unauthorized


class GitHubAPITest(VCRTestCase):
    def _get_vcr_kwargs(self):
        """
        This removes the authorization header
        from VCR so we don't record auth parameters
        """
        return {"filter_headers": ["Authorization"]}

    def setUp(self):
        self.client = GitHubAPI(getenv("TESTS_GITHUB_USER_TOKEN", "secret"))
        return super(GitHubAPITest, self).setUp()

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
        [self.assertIn("nameWithOwner", repo) for repo in repos]

        # Test Unauthorized exception when using bad credentials
        self.client.access_token = "bad-token"
        self.assertRaises(Unauthorized, self.client.get_user_repositories)

    def test_get_org_repositories(self):
        repos = self.client.get_org_repositories("canonical-web-and-design")
        [self.assertIn("nameWithOwner", repo) for repo in repos]

        # Test Unauthorized exception when using bad credentials
        self.client.access_token = "bad-token"
        self.assertRaises(Unauthorized, self.client.get_user_repositories)

    def test_get_orgs(self):
        orgs = self.client.get_orgs()
        [self.assertIn("name", org) for org in orgs]
        [self.assertIn("login", org) for org in orgs]

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

    def check_snapcraft_yaml_name(self):
        case1 = self.client.check_snapcraft_yaml_name(
            "build-staging-snapcraft-io", "test1", "test1"
        )
        self.assertEqual(True, case1)

        case2 = self.client.check_snapcraft_yaml_name(
            "build-staging-snapcraft-io", "test1", "new-name"
        )
        self.assertEqual(False, case2)

        case3 = self.client.check_snapcraft_yaml_name(
            "build-staging-snapcraft-io", "test5", "no-snap"
        )
        self.assertEqual(False, case3)
