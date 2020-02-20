import hmac
from hashlib import sha1
from os import getenv

from webapp import api
from webapp.helpers import get_yaml_loader
from werkzeug.exceptions import Unauthorized


GITHUB_WEBHOOK_SECRET = getenv("GITHUB_WEBHOOK_SECRET")


class GitHubAPI:
    """
    Provides authentication for GitHub users. Helper methods are also provided
    for checking organization access and getting user data from the Github API.
    """

    REST_API_URL = "https://api.github.com"
    GRAPHQL_API_URL = "https://api.github.com/graphql"

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

    def _request(self, method="GET", url="", data={}, raise_exceptions=True):
        """
        Makes a raw HTTP request and returns the response.
        """
        if self.access_token:
            headers = {"Authorization": f"token {self.access_token}"}
        else:
            headers = {}

        response = self.session.request(
            method, f"{self.REST_API_URL}/{url}", headers=headers, json=data
        )

        if raise_exceptions:
            if response.status_code == 401:
                raise Unauthorized(response=response)

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
                    ownerAffiliations: [OWNER],
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

    def check_permissions_over_repo(
        self, owner, repo, permissions=["admin", "write"]
    ):
        """
        Return True when the current user has the requested permissions
        """
        username = self.get_user()["login"]
        response = self._request(
            "GET",
            f"repos/{owner}/{repo}/collaborators/{username}/permission",
            raise_exceptions=False,
        )
        return response.json().get("permission") in permissions

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

            response.raise_for_status()

        return False

    def get_snapcraft_yaml_name(self, owner, repo):
        """
        Return True if the name inside the yaml file match with the snap
        """
        loc = self.get_snapcraft_yaml_location(owner, repo)

        if loc:
            response = self._request(
                "GET", f"repos/{owner}/{repo}/contents/{loc}",
            )
            file_metadata = response.json()

            response = self.session.request(
                "GET", file_metadata["download_url"]
            )

            yaml = get_yaml_loader()
            content = yaml.load(response.content)

            return content.get("name")

        return False

    def gen_webhook_secret(self, owner, repo):
        """
        Generate the same secret that we receive from a GitHub webhook.
        """
        key = bytes(GITHUB_WEBHOOK_SECRET, "UTF-8")
        hm = hmac.new(key, digestmod=sha1)
        hm.update(owner.encode("UTF-8"))
        hm.update(repo.encode("UTF-8"))
        return hm.hexdigest()
