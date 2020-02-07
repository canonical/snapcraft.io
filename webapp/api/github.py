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

        return self._request(gql)["viewer"]

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

        gql_response = self._request(gql)["viewer"]["organizations"]
        page_info = gql_response["pageInfo"]
        orgs = self._get_nodes(gql_response["edges"])

        if page_info["hasNextPage"]:
            next_page = self.get_orgs(page_info["endCursor"])
            orgs.append(next_page)

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
        repositories = self._get_nodes(gql_response["edges"])
        processed_repos = {"with-yaml": [], "others": []}

        for repo in repositories:
            processed_repo = {}

            processed_repo["name"] = repo["nameWithOwner"]
            processed_repo["snapcraft_yaml"] = any(
                [bool(repo[f"yamlLocation{i}"]) for i in range(1, 4)]
            )

            if processed_repo["snapcraft_yaml"]:
                processed_repos["with-yaml"].append(processed_repo)
            else:
                processed_repos["others"].append(processed_repo)

        if page_info["hasNextPage"]:
            next_page = self.get_user_repositories(page_info["endCursor"])
            processed_repos["with-yaml"].extend(next_page["with-yaml"])
            processed_repos["others"].extend(next_page["others"])

        return processed_repos

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
          }
        }"""
        )
        response = self._request(gql)["viewer"]["organization"]["repositories"]
        page_info = response["pageInfo"]
        repositories = self._get_nodes(response["edges"])
        processed_repos = {"with-yaml": [], "others": []}

        for repo in repositories:
            processed_repo = {}

            processed_repo["name"] = repo["nameWithOwner"]
            processed_repo["snapcraft_yaml"] = any(
                [bool(repo[f"yamlLocation{i}"]) for i in range(1, 4)]
            )

            if processed_repo["snapcraft_yaml"]:
                processed_repos["with-yaml"].append(processed_repo)
            else:
                processed_repos["others"].append(processed_repo)

        if page_info["hasNextPage"]:
            next_page = self.get_org_repositories(
                org_login, page_info["endCursor"]
            )
            processed_repos["with-yaml"].extend(next_page["with-yaml"])
            processed_repos["others"].extend(next_page["others"])

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
