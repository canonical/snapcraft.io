from pathlib import Path
import unittest

from ruamel.yaml import YAML

WORKFLOWS = Path(__file__).resolve().parents[1] / ".github" / "workflows"


class TestAutoQaCancellation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        yaml = YAML(typ="safe")
        cls.cancellation = yaml.load(
            (WORKFLOWS / "auto-qa-cancel.yml").read_text()
        )
        cls.compiled = yaml.load((WORKFLOWS / "auto-qa.lock.yml").read_text())
        cls.source = yaml.load(
            (WORKFLOWS / "auto-qa.md").read_text().split("---", 2)[1]
        )

    def test_push_triggers_cancellation_not_replacement_qa(self):
        self.assertEqual(
            self.cancellation["on"],
            {"pull_request": {"types": ["synchronize"]}},
        )
        for workflow in (self.source, self.compiled):
            with self.subTest(workflow=workflow["name"]):
                self.assertEqual(
                    workflow["on"]["pull_request"]["types"], ["labeled"]
                )

    def test_cancellation_matches_active_qa_group_for_each_pr(self):
        label_suffix = (
            "${{ github.event.label.name == 'auto-qa' "
            "&& 'qa' || github.run_id }}"
        )
        for workflow in (self.source, self.compiled):
            group = workflow["concurrency"]["group"]
            self.assertIn(label_suffix, group)
            self.assertEqual(
                self.cancellation["concurrency"]["group"],
                group.replace(label_suffix, "qa"),
            )
            self.assertIs(workflow["concurrency"]["cancel-in-progress"], True)
        self.assertIs(
            self.cancellation["concurrency"]["cancel-in-progress"], True
        )
        self.assertIn(
            "${{ github.event.pull_request.number }}",
            self.cancellation["concurrency"]["group"],
        )

    def test_cancellation_needs_no_write_permissions_or_pr_code(self):
        self.assertEqual(self.cancellation["permissions"], {})
        jobs = self.cancellation["jobs"]
        self.assertEqual(list(jobs), ["cancel-stale-qa"])
        job = jobs["cancel-stale-qa"]
        self.assertEqual(
            job["if"],
            "contains(github.event.pull_request.labels.*.name, 'auto-qa')",
        )
        self.assertEqual(len(job["steps"]), 1)
        self.assertEqual(
            job["steps"][0]["run"],
            "echo 'Stale Auto QA cancelled. "
            "Re-add auto-qa after the new demo is ready.'",
        )


if __name__ == "__main__":
    unittest.main()
