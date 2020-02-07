from hashlib import md5
from webapp.api.requests import Session


class Launchpad:
    """
    Provides authentication for Launchpad.
    """

    BASE_URL = "https://api.launchpad.net"

    def __init__(self, username, token, signature, session=Session()):
        self.username = username
        self.session = session
        self.session.headers["Accept"] = "application/json"
        self.session.headers["Authorization"] = (
            f'OAuth oauth_version="1.0", '
            f'oauth_signature_method="PLAINTEXT", '
            f"oauth_consumer_key={username}, "
            f'oauth_token="{token}", '
            f'oauth_signature="&{signature}"'
        )

    def _request(self, method="GET", url=None, params={}, data={}):
        """
        Makes a raw HTTP request and returns the response.
        """
        url = f"{self.BASE_URL}/devel/{url}"

        response = self.session.request(method, url, params=params, data=data)
        response.raise_for_status()

        return response.json() if response.content else None

    def get_collection_entries(self, resource, params=None):
        """
        Return collection items from the API
        """
        collection = self._request(url=resource, params=params)

        return collection.get("entries", [])

    def get_snap_by_store_name(self, snap_name):
        """
        Return an Snap from the Launchpad API by store_name
        """
        snaps = self.get_collection_entries(
            "+snaps",
            {
                "ws.op": "findByStoreName",
                "owner": "/~build.snapcraft.io",
                "store_name": snap_name,
            },
        )

        # The Launchpad API only allow to perform a find by store_name
        # but we are only interested in exactly this one
        if snaps and snaps[0]["store_name"] == snap_name:
            return snaps[0]

        return None

    def new_snap(self, snap_name, git_url):
        """
        Create an ISnap in Launchpad
        """
        data = {
            "ws.op": "new",
            "owner": f"/~{self.username}",
            "name": md5(git_url.encode("UTF-8")).hexdigest(),
            "store_name": snap_name,
            "git_repository_url": git_url,
            "git_path": "HEAD",
            "auto_build": "false",
            "auto_build_archive": "/ubuntu/+archive/primary",
            "auto_build_pocket": "Updates",
            "processors": [
                "/+processors/amd64",
                "/+processors/arm64",
                "/+processors/armhf",
                "/+processors/i386",
                "/+processors/ppc64el",
                "/+processors/s390x",
            ],
            "store_series": "/+snappy-series/16",
        }

        return self._request("POST", "+snaps", data=data)

    def trigger_build(self, snap_name):
        """
        Create a new build for a Snap
        """
        lp_snap = self.get_snap_by_store_name(snap_name)

        data = {
            "ws.op": "requestBuild",
            "channels": "snapcraft,apt",
            "archive": f"{self.BASE_URL}/devel/ubuntu/+archive/primary",
            "pocket": "Updates",
        }

        archs = [
            "amd64",
            "arm64",
            "armhf",
            "i386",
            "ppc64el",
            "s390x",
        ]

        for arch in archs:
            data["distro_arch_series"] = f"/ubuntu/xenial/{arch}"
            self._request("POST", lp_snap["self_link"][32:], data=data)

        return True
