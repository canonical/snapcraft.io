import json
from pathlib import Path
import unittest

from ruamel.yaml import YAML

WORKFLOWS = Path(__file__).resolve().parents[1] / ".github" / "workflows"
REPOSITORY = "${{ github.repository }}"


class TestAutoQaAccess(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        yaml = YAML(typ="safe")
        text = (WORKFLOWS / "auto-qa.md").read_text()
        _, frontmatter, cls.prompt = text.split("---", 2)
        cls.source = yaml.load(frontmatter)
        cls.compiled = yaml.load((WORKFLOWS / "auto-qa.lock.yml").read_text())

    def test_unmerged_content_is_readable_only_in_this_repository(self):
        github = self.source["tools"]["github"]
        self.assertEqual(github["mode"], "gh-proxy")
        self.assertEqual(github["allowed-repos"], [REPOSITORY])
        # Explicit-SHA contents and PR patches can have baseline none integrity,
        # even when the author is a trusted bot or a repository collaborator.
        self.assertEqual(github["min-integrity"], "none")

    def test_compiled_cli_proxy_preserves_the_explicit_policy(self):
        steps = self.compiled["jobs"]["agent"]["steps"]
        policies = [
            json.loads(step["env"]["CLI_PROXY_POLICY"])
            for step in steps
            if "CLI_PROXY_POLICY" in step.get("env", {})
        ]
        self.assertEqual(
            policies,
            [
                {
                    "allow-only": {
                        "repos": [REPOSITORY],
                        "min-integrity": "none",
                    }
                }
            ],
        )

    def test_read_access_does_not_enable_pr_execution_or_more_writes(self):
        self.assertIs(self.source["checkout"], False)
        self.assertIs(self.source["strict"], True)
        self.assertIs(self.source["tools"]["edit"], False)
        self.assertIn(
            "Never check out, build, install, import, or execute PR code",
            self.prompt,
        )
        self.assertEqual(self.compiled["permissions"], {})
        for permission in ("contents", "issues", "pull-requests", "actions"):
            with self.subTest(permission=permission):
                self.assertEqual(
                    self.compiled["jobs"]["agent"]["permissions"][permission],
                    "read",
                )
        outputs = self.source["safe-outputs"]
        self.assertEqual(outputs["add-comment"]["target"], "triggering")
        self.assertEqual(outputs["add-comment"]["max"], 1)
        self.assertEqual(outputs["add-comment"]["required-labels"], ["auto-qa"])
        self.assertIs(outputs["threat-detection"]["continue-on-error"], False)

    def test_prompt_handles_filtered_files_and_missing_checkout(self):
        for instruction in (
            "compare the unique count to `changed_files`",
            "retrieval or policy-filtering limitation",
            "Do not guess filenames",
            "There is no local application checkout",
            "validated `head_sha`",
            "Never check out or execute the retrieved source",
        ):
            with self.subTest(instruction=instruction):
                self.assertIn(instruction, self.prompt)


if __name__ == "__main__":
    unittest.main()
