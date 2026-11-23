from pathlib import Path
import unittest

from ruamel.yaml import YAML

WORKFLOWS = Path(__file__).resolve().parents[1] / ".github" / "workflows"


class TestAutoQaCancellation(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        yaml = YAML(typ="safe")
        cls.compiled = yaml.load((WORKFLOWS / "auto-qa.lock.yml").read_text())
        cls.source = yaml.load(
            (WORKFLOWS / "auto-qa.md").read_text().split("---", 2)[1]
        )

    def test_existing_workflow_handles_labels_and_pushes(self):
        for workflow in (self.source, self.compiled):
            with self.subTest(workflow=workflow["name"]):
                self.assertEqual(
                    workflow["on"]["pull_request"]["types"],
                    ["labeled", "synchronize"],
                )
        self.assertFalse((WORKFLOWS / "auto-qa-cancel.yml").exists())

    def test_pushes_share_qa_group_but_other_labels_do_not(self):
        expected_group = (
            "auto-qa-${{ github.event.pull_request.number }}-"
            "${{ (github.event.action == 'synchronize' || "
            "github.event.label.name == 'auto-qa') && 'qa' || github.run_id }}"
        )
        for workflow in (self.source, self.compiled):
            with self.subTest(workflow=workflow["name"]):
                self.assertEqual(
                    workflow["concurrency"]["group"], expected_group
                )
                self.assertIs(
                    workflow["concurrency"]["cancel-in-progress"], True
                )

    def test_push_cancels_without_activating_qa(self):
        label_only = "github.event.action == 'labeled' &&"
        self.assertTrue(self.source["if"].startswith(label_only))
        for job in ("pre_activation", "activation"):
            with self.subTest(job=job):
                self.assertIn(label_only, self.compiled["jobs"][job]["if"])
        self.assertEqual(self.compiled["permissions"], {})
        self.assertEqual(
            self.compiled["jobs"]["agent"]["needs"],
            ["activation", "qa_preflight"],
        )


if __name__ == "__main__":
    unittest.main()
