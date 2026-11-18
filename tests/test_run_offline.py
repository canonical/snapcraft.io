"""Check the offline wrapper's command plumbing without requiring root."""

import os
from pathlib import Path
import subprocess
import tempfile
import unittest


class RunOfflineTest(unittest.TestCase):
    def setUp(self):
        temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(temp_dir.cleanup)
        self.temp = Path(temp_dir.name)
        self.script = (
            Path(__file__).resolve().parents[1] / "scripts/run-offline.sh"
        )
        self.env = {
            **os.environ,
            "PATH": f"{self.temp}:{os.environ['PATH']}",
            "LOOPBACK_READY": str(self.temp / "loopback"),
            "OFFLINE_TEST_VALUE": "preserved value",
        }
        commands = {
            "sudo": """
if [[ "$1" == --user=* ]]; then
  [[ "$1" == "--user=$(id -un)" ]] || exit 92
  shift
fi
[[ "$1" == -- ]] || exit 93
shift
# Emulate sudo-rs discarding the environment.
exec env -i PATH="$PATH" "$@"
""",
            "unshare": """
[[ "$1" == --net && "$2" == -- ]] || exit 94
shift 2
exec "$@"
""",
            "ip": """
[[ "$*" == 'link set lo up' ]] || exit 95
[[ "${FAIL_LOOPBACK:-0}" == 0 ]] || exit 43
touch "$LOOPBACK_READY"
""",
        }
        for name, body in commands.items():
            command = self.temp / name
            command.write_text(
                "#!/usr/bin/env bash\nset -euo pipefail\n" + body
            )
            command.chmod(0o755)

    def run_command(self, *args):
        return subprocess.run(
            ["bash", str(self.script), *args],
            env=self.env,
            capture_output=True,
            text=True,
        )

    def test_preserves_arguments_environment_and_sets_up_loopback(self):
        result = self.run_command(
            "bash",
            "-c",
            'test -f "$LOOPBACK_READY" && '
            'test "$OFFLINE_TEST_VALUE" = "preserved value" && '
            'printf "%s\\n" "$@"',
            "bash",
            "argument with spaces",
            "",
            "*.py",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, "argument with spaces\n\n*.py\n")

    def test_preserves_command_exit_status(self):
        result = self.run_command("bash", "-c", "exit 42")
        self.assertEqual(result.returncode, 42, result.stderr)

    def test_setup_failure_does_not_run_command(self):
        self.env["FAIL_LOOPBACK"] = "1"
        marker = self.temp / "command-ran"
        result = self.run_command("touch", str(marker))
        self.assertEqual(result.returncode, 43, result.stderr)
        self.assertFalse(marker.exists())
