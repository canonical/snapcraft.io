from urllib.parse import urljoin
from webapp import api


class GitHubAPI:
    """
    Provides authentication for GitHub users. Helper methods are also provided
    for checking organization access and getting user data from the Github API.
    """

    BASE_URL = "https://api.github.com/"

    def __init__(self, access_token=None, session=api.requests.Session()):
        self.access_token = access_token
        self.session = session
        self.session.headers["Accept"] = "application/json"

        if self.access_token:
            self.session.headers["Authorization"] = f"token {access_token}"

    def _request(self, method, url_path, data={}, params={}):
        """
        Makes a raw HTTP request and returns the response.
        """
        return self.session.request(
            method, urljoin(self.BASE_URL, url_path), params=params, json=data
        )

    def get_resource(self, url_path, per_page=100, page=1):
        """
        Makes a raw HTTP GET request and returns the response.
        """
        params = {"per_page": per_page, "page": page}

        return self._request(method="GET", url_path=url_path, params=params)

    def get_user(self):
        """
        Sets the user to the currently authorized user if it is not already and
        returns it. The user object is the dictionary response from the API.
        """
        resp = self.get_resource("user")

        return resp.json() if resp.ok else None

    def get_user_repositories(self, all_pages=True, page=1):
        """
        Lists repositories that the authenticated user has explicit permission
        to access.
        """
        repos = []
        resp = self.get_resource(f"user/repos", page=page)

        if resp.ok:
            repos.extend(resp.json())

        if all_pages and "next" in resp.links:
            repos.extend(self.get_user_repositories(page=page + 1))

        return repos

    def get_user_orgs(self, all_pages=True, page=1):
        """
        Lists organizations that the authenticated user has explicit permission
        to access.
        """
        orgs = []
        resp = self.get_resource(f"user/orgs", page=page)

        if resp.ok:
            orgs.extend(resp.json())

        if all_pages and "next" in resp.links:
            orgs.extend(self.get_user_orgs(page=page + 1))

        return orgs
