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
        [self.assertIn("name", repo) for repo in repos["with-yaml"]]
        [self.assertIn("name", repo) for repo in repos["others"]]

        # Test Unauthorized exception when using bad credentials
        self.client.access_token = "bad-token"
        self.assertRaises(Unauthorized, self.client.get_user_repositories)
        self.client.access_token = getenv("TESTS_GITHUB_USER_TOKEN", "secret")

    def test_get_org_repositories(self):
        repos = self.client.get_org_repositories("canonical-web-and-design")
        [self.assertIn("name", repo) for repo in repos["with-yaml"]]
        [self.assertIn("name", repo) for repo in repos["others"]]

        # Test Unauthorized exception when using bad credentials
        self.client.access_token = "bad-token"
        self.assertRaises(Unauthorized, self.client.get_user_repositories)
        self.client.access_token = getenv("TESTS_GITHUB_USER_TOKEN", "secret")

    def test_get_orgs(self):
        orgs = self.client.get_orgs()
        [self.assertIn("name", org) for org in orgs]
        [self.assertIn("login", org) for org in orgs]

    def test_is_snapcraft_yaml_present(self):
        # /snapcraft.yaml is present
        case1 = self.client.is_snapcraft_yaml_present(
            "build-staging-snapcraft-io", "test1"
        )
        self.assertEqual(True, case1)

        # /.snapcraft.yaml is present
        case2 = self.client.is_snapcraft_yaml_present(
            "build-staging-snapcraft-io", "test2"
        )
        self.assertEqual(True, case2)

        # /snap/snapcraft.yaml is present
        case3 = self.client.is_snapcraft_yaml_present(
            "build-staging-snapcraft-io", "test3"
        )
        self.assertEqual(True, case3)

        # /build-aux/snap/snapcraft.yaml is present
        case4 = self.client.is_snapcraft_yaml_present(
            "build-staging-snapcraft-io", "test4"
        )
        self.assertEqual(True, case4)

        # The repo doesn't contain a valid yaml file
        case5 = self.client.is_snapcraft_yaml_present(
            "build-staging-snapcraft-io", "test5"
        )
        self.assertEqual(False, case5)
