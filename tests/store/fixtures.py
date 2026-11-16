"""Shared store API response fixtures."""

SNAP_PAYLOAD = {
    "snap-id": "id",
    "name": "toto",
    "default-track": None,
    "snap": {
        "title": "Snap Title",
        "summary": "This is a summary",
        "description": "this is a description",
        "media": [],
        "license": "license",
        "publisher": {
            "display-name": "Toto",
            "username": "toto",
            "validation": True,
        },
        "categories": [{"name": "test"}],
        "trending": False,
        "unlisted": False,
        "links": {},
    },
    "channel-map": [
        {
            "channel": {
                "architecture": "amd64",
                "name": "stable",
                "risk": "stable",
                "track": "latest",
                "released-at": "2018-09-18T14:45:28.064633+00:00",
            },
            "created-at": "2018-09-18T14:45:28.064633+00:00",
            "version": "1.0",
            "confinement": "conf",
            "download": {"size": 100000},
            "revision": 1,
        }
    ],
}
