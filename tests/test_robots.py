import os
import re
import unittest

from protego import Protego

from webapp.app import create_app

ROBOTS_PATH = os.path.join(os.path.dirname(__file__), "..", "robots.txt")
BASE_URL = "https://snapcraft.io"


def parse_groups(text):
    groups = {}
    pending = []
    in_rules = False

    for raw_line in text.splitlines():
        line = raw_line.split("#", 1)[0].strip()

        if not line or ":" not in line:
            continue

        key, value = (part.strip() for part in line.split(":", 1))
        key = key.lower()

        if key == "user-agent":
            if in_rules:
                pending = []
                in_rules = False
            pending.append(value.lower())
            groups.setdefault(value.lower(), [])
        elif key in ("allow", "disallow"):
            in_rules = True
            for agent in pending:
                groups[agent].append((key, value))

    return groups


def is_login_gated(view):
    seen = set()

    while view is not None and id(view) not in seen:
        seen.add(id(view))
        code = getattr(view, "__code__", None)
        if code is not None and code.co_name == "is_user_logged_in":
            return True
        view = getattr(view, "__wrapped__", None)

    return False


def sample_path(rule):
    path = re.sub(r"<any\([^)]*\):[^>]+>", "snaps", rule)
    path = re.sub(r"<regex\([^)]*\):[^>]+>", "firefox", path)
    path = re.sub(r"<path:[^>]+>", "x/y", path)
    path = re.sub(r"<[^>]*snap_name>", "firefox", path)

    return re.sub(r"<[^>]+>", "x", path)


class TestRobots(unittest.TestCase):
    def setUp(self):
        with open(ROBOTS_PATH) as robots_file:
            robots = robots_file.read()

        self.robots = Protego.parse(robots)
        self.groups = parse_groups(robots)
        self.app = create_app(testing=True)

    def can_fetch(self, agent, path):
        return self.robots.can_fetch(BASE_URL + path, agent)

    def find_crawlable(self, paths):
        return [
            (agent, path)
            for agent in self.groups
            for path in paths
            if self.can_fetch(agent, path)
        ]

    def find_blocked(self, paths):
        return [
            (agent, path)
            for agent in self.groups
            for path in paths
            if not self.can_fetch(agent, path)
        ]

    def test_robots_txt_is_served_and_not_empty(self):
        response = self.app.test_client().get("/robots.txt")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"User-Agent", response.data)

    def test_login_gated_routes_are_disallowed_for_every_agent(self):
        gated = sorted(
            {
                sample_path(rule.rule)
                for rule in self.app.url_map.iter_rules()
                if is_login_gated(self.app.view_functions.get(rule.endpoint))
            }
        )

        self.assertTrue(gated, "no login-gated routes found")

        leaks = self.find_crawlable(gated)

        self.assertEqual(leaks, [], f"login-gated routes crawlable: {leaks}")

    def test_public_content_is_crawlable_for_every_agent(self):
        public_paths = [
            "/",
            "/about",
            "/about/publish",
            "/about/listing",
            "/about/release",
            "/about/publicise",
            "/store",
            "/store/categories/games",
            "/blog/",
            "/docs/",
            "/build",
            "/iot",
            "/tutorials",
            "/firefox",
            "/publisher/canonical",
        ]

        blocked = self.find_blocked(public_paths)

        self.assertEqual(
            blocked, [], f"public content is not crawlable: {blocked}"
        )

    def test_snaps_named_after_reserved_paths_are_crawlable(self):
        snap_paths = [
            "/accountable2you",
            "/administrative-assistant",
            "/searchsploit",
            "/search-helper-tool",
            "/build-and-measure",
            "/iot-manager",
            "/iotconnect",
            "/publisher-subscriber",
            "/store-admin",
            "/api-mocker-gateway",
            "/apilume",
        ]

        blocked = self.find_blocked(snap_paths)

        self.assertEqual(
            blocked, [], f"snap pages blocked by an unanchored rule: {blocked}"
        )

    def test_wildcard_rules_apply_to_every_named_agent(self):
        wildcard = set(self.groups["*"])

        for agent, rules in self.groups.items():
            if agent == "*":
                continue

            missing = sorted(wildcard - set(rules))

            self.assertEqual(
                missing, [], f"{agent} is missing rules from '*': {missing}"
            )
