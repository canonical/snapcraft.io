import hmac
from hashlib import sha1
from os import getenv

from webapp import api
from webapp.helpers import get_yaml_loader
from werkzeug.exceptions import Unauthorized, Forbidden
from requests.exceptions import HTTPError

GITHUB_WEBHOOK_SECRET = getenv("GITHUB_WEBHOOK_SECRET")


class InvalidYAML(Exception):
    pass


class GitHub:
    """
    Provides authentication for GitHub users. Helper methods are also provided
    for checking organization access and getting user data from the Github API.
    """

    REST_API_URL = "https://api.github.com"
    GRAPHQL_API_URL = "https://api.github.com/graphql"
    RAW_CONTENT_URL = "https://raw.githubusercontent.com"

    YAML_LOCATIONS = [
        "snapcraft.yaml",
        ".snapcraft.yaml",
        "snap/snapcraft.yaml",
        "build-aux/snap/snapcraft.yaml",
    ]

    def __init__(self, access_token=None, session=api.requests.Session()):
        self.access_token = access_token
        self.session = session
        self.session.headers["Accept"] = "application/json"

    def _request(
        self, method="GET", url="", params={}, data={}, raise_exceptions=True
    ):
        """
        Makes a raw HTTP request and returns the response.
        """
        if self.access_token:
            headers = {"Authorization": f"token {self.access_token}"}
        else:
            headers = {}

        response = self.session.request(
            method,
            f"{self.REST_API_URL}/{url}",
            headers=headers,
            params=params,
            json=data,
        )

        if raise_exceptions:
            if response.status_code == 401:
                raise Unauthorized(response=response)
            if response.status_code == 403:
                raise Forbidden(response=response)

            response.raise_for_status()

        return response

    def _gql_request(self, query={}):
        """
        Makes a raw HTTP request and returns the response.
        """
        if self.access_token:
            headers = {"Authorization": f"token {self.access_token}"}
        else:
            headers = {}

        response = self.session.request(
            "POST",
            self.GRAPHQL_API_URL,
            json={"query": query},
            headers=headers,
        )

        if response.status_code == 401:
            raise Unauthorized(response=response)
        if response.status_code == 403:
            raise Forbidden

        response.raise_for_status()
        return response.json()["data"]

    def _get_nodes(self, edges):
        """
        GraphQL: Return the list of nodes from the edges
        """
        return [i["node"] for i in edges]

    def get_user(self):
        """
        Return some user properties of the current user
        """
        gql = """
        {
          viewer {
            login
            name
            avatarUrl(size: 100)
          }
        }
        """

        return self._gql_request(gql)["viewer"]

    def get_orgs(self, end_cursor=None):
        """
        Lists of organizations that the authenticated user has explicit
        permission to access.
        """
        gql = (
            """
            {
              viewer {
                organizations(first: 100,"""
            + (f'after: "{end_cursor}"' if end_cursor else "")
            + """) {
                  edges {
                    node {
                      login
                      name
                    }
                  }
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                }
              }
            }
        """
        )

        gql_response = self._gql_request(gql)["viewer"]["organizations"]
        page_info = gql_response["pageInfo"]
        orgs = self._get_nodes(gql_response["edges"])

        if page_info["hasNextPage"]:
            next_page = self.get_orgs(page_info["endCursor"])
            orgs.extend(next_page)

        return orgs

    def get_user_repositories(self, end_cursor=None):
        """
        Lists of public repositories from the authenticated user
        """
        gql = (
            """{
              viewer {
                repositories(
                    first: 100,
                    privacy: PUBLIC,
                """
            + (f'after: "{end_cursor}"' if end_cursor else "")
            + """
                ) {
              edges {
                node {
                  name
                  nameWithOwner
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }"""
        )

        gql_response = self._gql_request(gql)["viewer"]["repositories"]
        page_info = gql_response["pageInfo"]
        repositories = self._get_nodes(gql_response["edges"])

        if page_info["hasNextPage"]:
            next_page = self.get_user_repositories(page_info["endCursor"])
            repositories.extend(next_page)

        return repositories

    def get_org_repositories(self, org_login, end_cursor=None):
        """
        Lists of public repositories from the authenticated user
        """
        gql = (
            """{
              viewer {
              organization(login: \""""
            + org_login
            + """") {
                    repositories(
                        first: 100,
                        privacy: PUBLIC
                    """
            + (f'after: "{end_cursor}"' if end_cursor else "")
            + """
                ) {
              edges {
                node {
                  name
                }
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
          }
        }"""
        )
        response = self._gql_request(gql)["viewer"]["organization"][
            "repositories"
        ]

        page_info = response["pageInfo"]
        repositories = self._get_nodes(response["edges"])

        if page_info["hasNextPage"]:
            next_page = self.get_org_repositories(
                org_login, page_info["endCursor"]
            )
            repositories.extend(next_page)

        return repositories

    def check_permissions_over_repo(self, owner, repo, permission="push"):
        """
        Return True when the current user has the requested permissions
        Possible values: "admin", "push" or "pull"
        """
        try:
            response = self._request(
                "GET",
                f"repos/{owner}/{repo}",
                raise_exceptions=True,
            )
        except Unauthorized:
            return False
        except Forbidden:
            return False
        except HTTPError as e:
            if e.response.status_code == 404:
                return False

        response_permissions = response.json()["permissions"]
        user_permissions = [
            p for p in response_permissions if response_permissions[p]
        ]

        return permission in user_permissions

    def check_if_repo_exists(self, owner, repo):
        """
        Return True if GitHub repo exists
        """
        response = self._request(
            "GET",
            f"repos/{owner}/{repo}",
            raise_exceptions=False,
        )
        if response.status_code == 404:
            return False
        elif response.status_code == 200:
            return True
        elif response.status_code == 401:
            raise Unauthorized
        elif response.status_code == 403:
            raise Forbidden

        response.raise_for_status()

    def get_snapcraft_yaml_location(self, owner, repo):
        """
        Return the snapcraft.yaml file location in the GitHub repo
        """

        # It is not possible to use GraphQL without authentication
        # for that reason we are doing a call for each location to the REST API
        for loc in self.YAML_LOCATIONS:
            response = self._request(
                "GET",
                f"repos/{owner}/{repo}/contents/{loc}",
                raise_exceptions=False,
            )
            if response.status_code == 404:
                continue
            elif response.status_code == 200:
                return loc
            elif response.status_code == 401:
                raise Unauthorized
            elif response.status_code == 403:
                raise Forbidden

            response.raise_for_status()

        return False

    def get_default_branch(self, owner, repo):
        response = self._request("GET", f"repos/{owner}/{repo}")
        return response.json()["default_branch"]

    def get_last_commit(self, owner, repo, branch=None):
        if not branch:
            branch = self.get_default_branch(owner, repo)

        response = self._request(
            "GET", f"repos/{owner}/{repo}/commits/{branch}"
        )
        return response.json()["sha"]

    def get_snapcraft_yaml_data(self, owner, repo, location=None):
        """
        Parse the snapcraft.yaml from the repo and return a dict
        """
        if not location:
            location = self.get_snapcraft_yaml_location(owner, repo)

        if location:
            # Get last commit to avoid cache issues with raw.github.com
            last_commit = self.get_last_commit(owner, repo)

            response = self.session.request(
                "GET",
                f"{self.RAW_CONTENT_URL}/{owner}/{repo}"
                f"/{last_commit}/{location}",
            )

            yaml = get_yaml_loader()

            try:
                return yaml.load(response.content)
            except Exception:
                raise InvalidYAML

        return {}

    def generate_webhook_secret_for_repo(self, owner, name):
        key = bytes(GITHUB_WEBHOOK_SECRET, "UTF-8")
        hmac_gen = hmac.new(key, None, sha1)
        hmac_gen.update(bytes(owner, "UTF-8"))
        hmac_gen.update(bytes(name, "UTF-8"))
        return hmac_gen.hexdigest()

    def validate_webhook_signature(self, payload, signature):
        """
        Generate the payload signature and compare with the given one
        """
        key = bytes(GITHUB_WEBHOOK_SECRET, "UTF-8")
        hmac_gen = hmac.new(key, payload, sha1)

        # Add append prefix to match the GitHub request format
        digest = f"sha1={hmac_gen.hexdigest()}"

        return hmac.compare_digest(digest, signature)

    def validate_bsi_webhook_secret(self, owner, name, payload, signature):
        """
        Return True if the webhook contain a valid secret in BSI
        """
        secret = self.generate_webhook_secret_for_repo(owner, name)
        final_key = bytes(secret, "UTF-8")
        final_hmac = hmac.new(final_key, payload, sha1)

        # Add append prefix to match the GitHub request format
        digest = f"sha1={final_hmac.hexdigest()}"

        return hmac.compare_digest(digest, signature)

    def get_hooks(self, owner, repo, page=1):
        """
        Return all the webhooks in the repo
        """
        response = self._request(
            "GET",
            f"repos/{owner}/{repo}/hooks",
            params={"per_page": 100, "page": page},
        )
        hooks = response.json()

        if "next" in response.links:
            hooks.extend(self.get_hooks(page=page + 1))

        return hooks

    def get_hook_by_url(self, owner, repo, url):
        """
        Return a webhook from the repo with the url
        """
        hooks = self.get_hooks(owner, repo)

        for hook in hooks:
            if hook["config"]["url"] == url:
                return hook

        return None

    def update_hook_url(self, owner, repo, hook_id, new_url):
        """
        Update a webhook to activate it and update the URL
        """
        data = {
            "active": True,
            "config": {
                "url": new_url,
                "content_type": "json",
                "secret": GITHUB_WEBHOOK_SECRET,
            },
        }

        self._request(
            "PATCH", f"repos/{owner}/{repo}/hooks/{hook_id}", data=data
        )

        return True

    def create_hook(self, owner, repo, hook_url):
        """
        Create the webhook in the repo
        """
        secret = self.generate_webhook_secret_for_repo(owner, repo)
        data = {
            "config": {
                "url": hook_url,
                "content_type": "json",
                "secret": secret,
            },
        }

        self._request("POST", f"repos/{owner}/{repo}/hooks", data=data)

        return True

    def remove_hook(self, owner, repo, hook_id):
        """
        Remove GitHub webhook in a repo
        """
        self._request("DELETE", f"repos/{owner}/{repo}/hooks/{hook_id}")

        return True
