from webapp import api
from werkzeug.exceptions import Unauthorized


class GitHubAPI:
    """
    Provides authentication for GitHub users. Helper methods are also provided
    for checking organization access and getting user data from the Github API.
    """

    REST_API_URL = "https://api.github.com"
    GRAPHQL_API_URL = "https://api.github.com/graphql"

    def __init__(self, access_token=None, session=api.requests.Session()):
        self.access_token = access_token
        self.session = session
        self.session.headers["Accept"] = "application/json"

    def _request(self, query={}):
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

    def get_username(self):
        """
        Return the username of the current user
        """
        gql = "{ viewer { login } }"

        return self._request(gql)["viewer"]["login"]

    def get_user_repositories(self, end_cursor=None):
        """
        Lists repositories that the authenticated user has explicit permission
        to access.
        """
        gql = (
            """{
              viewer {
                repositories(
                    first: 100,
                    privacy: PUBLIC,
                    ownerAffiliations:
                        [OWNER, ORGANIZATION_MEMBER],
                """
            + (f'after: "{end_cursor}"' if end_cursor else "")
            + """
                ) {
              edges {
                node {
                  nameWithOwner
                  yamlLocation1:
                    object(expression: "master:snapcraft.yaml")
                    { id }
                  yamlLocation2:
                    object(expression: "master:.snapcraft.yaml")
                    { id }
                  yamlLocation3:
                    object(expression: "master:snap/snapcraft.yaml")
                    { id }
                  yamlLocation4:
                    object(expression: "master:build-aux/snap/snapcraft.yaml")
                    { id }
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

        gql_response = self._request(gql)["viewer"]["repositories"]
        page_info = gql_response["pageInfo"]
        repositories = gql_response["edges"]
        processed_repos = []

        for repo in repositories:
            processed_repo = {}

            processed_repo["name"] = repo["node"]["nameWithOwner"]
            processed_repo["snapcraft_yaml"] = any(
                [bool(repo["node"][f"yamlLocation{i}"]) for i in range(1, 4)]
            )
            processed_repos.append(processed_repo)

        if page_info["hasNextPage"]:
            processed_repos.extend(
                self.get_user_repositories(page_info["endCursor"])
            )

        return processed_repos

    def is_snapcraft_yaml_present(self, owner, repo):
        """
        Check is the snapcraft.yaml file exist in the GitHub repo
        """
        yaml_locations = [
            f"/repos/{owner}/{repo}/contents/snapcraft.yaml",
            f"/repos/{owner}/{repo}/contents/.snapcraft.yaml",
            f"/repos/{owner}/{repo}/contents/snap/snapcraft.yaml",
            f"/repos/{owner}/{repo}/contents/build-aux/snap/snapcraft.yaml",
        ]

        # It is not possible to use GraphQL without authentication
        # for that reason we are doing a call for each location to the REST API
        for location in yaml_locations:
            response = self.session.request(
                "GET", f"{self.REST_API_URL}{location}"
            )
            if response.status_code == 404:
                continue
            elif response.status_code == 200:
                return True

            response.raise_for_status()

        return False
