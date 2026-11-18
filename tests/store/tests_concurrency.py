import threading
import unittest
from unittest.mock import Mock, patch

from webapp.store.concurrency import run_tasks


class RunTasksTest(unittest.TestCase):
    @patch("webapp.store.concurrency.ThreadPoolExecutor")
    def test_no_tasks_does_not_create_executor(self, executor):
        self.assertEqual(run_tasks({}), {})
        executor.assert_not_called()

    @patch("webapp.store.concurrency.ThreadPoolExecutor")
    def test_single_task_runs_on_request_thread(self, executor):
        result = run_tasks({"thread": threading.get_ident})

        self.assertEqual(result, {"thread": threading.get_ident()})
        executor.assert_not_called()

    def test_multiple_tasks_overlap(self):
        barrier = threading.Barrier(3, timeout=5)

        def fetch(value):
            barrier.wait()
            return value

        tasks = {
            name: lambda name=name: fetch(name)
            for name in ("popular", "categories", "featured")
        }
        self.assertEqual(run_tasks(tasks), {name: name for name in tasks})

    def test_fetch_errors_propagate(self):
        for count in (1, 2):
            with self.subTest(count=count):
                tasks = {
                    str(index): Mock(side_effect=ValueError("invalid data"))
                    for index in range(count)
                }
                with self.assertRaisesRegex(ValueError, "invalid data"):
                    run_tasks(tasks)
