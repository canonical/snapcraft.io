from webapp import api


search_session = api.requests.CachedSession(expire_after=10)


class NoAPIKeyError(Exception):
    pass


def get_search_results(
    api_key,
    api_url,
    search_custom_id,
    query,
    start,
    num,
    session=search_session,
):
    """
    Query the Google Custom Search API for search results
    """
    if not api_key:
        raise NoAPIKeyError("Unable to search: No API key provided")

    results = session.get(
        api_url,
        params={
            "key": api_key,
            "cx": search_custom_id,
            "q": query,
            "siteSearch": "snapcraft.io",
            "start": start,
            "num": num,
        },
    ).json()

    if "items" in results:
        # Move "items" to "entries" as "items" is a method name for dicts
        # and it causes wierd things to happen in Jinja2
        results["entries"] = results.pop("items")
        for item in results["entries"]:
            item["htmlSnippet"] = item["htmlSnippet"].replace("<br>\n", "")

    return results
