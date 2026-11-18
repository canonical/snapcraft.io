from concurrent.futures import ThreadPoolExecutor


def run_tasks(tasks):
    """Run independent fetches concurrently only when there is work to overlap.

    Callers resolve cache hits before scheduling tasks. A single remaining
    fetch runs on the request thread, avoiding an unnecessary executor.
    """
    if len(tasks) <= 1:
        return {name: fetch() for name, fetch in tasks.items()}

    with ThreadPoolExecutor(max_workers=len(tasks)) as executor:
        futures = {
            name: executor.submit(fetch) for name, fetch in tasks.items()
        }
        return {name: future.result() for name, future in futures.items()}
