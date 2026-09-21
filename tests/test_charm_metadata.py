import os
import unittest

REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
CHARMCRAFT_PATH = os.path.join(REPO_ROOT, "charm", "charmcraft.yaml")


class TestCharmMetadata(unittest.TestCase):
    def test_flask_framework_charm_declares_oci_image_resource(self):
        with open(CHARMCRAFT_PATH) as charmcraft_file:
            charmcraft = charmcraft_file.read()

        self.assertIn("  - flask-framework\n", charmcraft)
        self.assertIn("resources:\n", charmcraft)
        self.assertIn("  flask-app-image:\n", charmcraft)
        self.assertIn("    type: oci-image\n", charmcraft)


if __name__ == "__main__":
    unittest.main()
