import { useState } from "react";
import { useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { Strip, Select, Row, Col, Button } from "@canonical/react-components";

import { githubDataState } from "../../state/atoms";

import type { GithubData } from "../../types/";

type Repo = { name: string; nameWithOwner: string };

function BuildsLoggedIn(): JSX.Element {
  const { snapId } = useParams();
  const githubData = useRecoilValue<GithubData | null>(githubDataState);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [validRepo, setValidRepo] = useState<boolean | null>(null);
  const [reposLoading, setReposLoading] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repo | undefined>();
  const [building, setBuilding] = useState<boolean>(false);

  const validateRepo = async (repo: Repo | undefined) => {
    if (!repo) {
      return;
    }

    setValidating(true);

    const response = await fetch(
      `/${snapId}/builds/validate-repo?repo=${repo.nameWithOwner}`,
    );

    if (!response.ok) {
      setValidationError(true);
      throw new Error("Not a valid repo");
    }

    const responseData = await response.json();

    if (responseData.success) {
      setValidRepo(true);
      setValidationMessage("");
      setValidationError(false);
    } else {
      setValidationMessage(responseData.error.message);
      setValidationError(true);
      setValidRepo(null);
    }

    setValidating(false);
  };

  const getRepos = async (org?: string) => {
    setReposLoading(true);

    let apiUrl = "/publisher/github/get-repos";

    if (org) {
      apiUrl += `?org=${org}`;
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw Error("Unable to fetch repos");
    }

    const responseData = await response.json();

    setReposLoading(false);

    setRepos(responseData);
  };

  const getOrgs = (): { label: string; value: string }[] => {
    if (githubData) {
      return githubData.github_orgs.map((org) => {
        return {
          label: org.name,
          value: org.name,
        };
      });
    }

    return [];
  };

  const getValidationStatusClassName = (): string => {
    if (validRepo) {
      return "is-success";
    }

    if (validationError) {
      return "is-error";
    }

    return "";
  };

  return (
    <>
      {githubData !== null && (
        <div className="snapcraft-p-sticky js-sticky-bar">
          <div className="u-fixed-width">
            <ul className="p-inline-list u-no-margin--bottom">
              <li className="p-inline-list__item u-no-margin--right">
                Your GitHub account is connected.
              </li>
              <li className="p-inline-list__item">
                <a
                  href={`https://github.com/${githubData.github_user.login}`}
                  className="p-link--soft u-float-right"
                >
                  <img
                    src={githubData.github_user.avatarUrl}
                    alt={`@${githubData.github_user.login}`}
                    className="p-build__avatar"
                  />{" "}
                  {githubData.github_user.name}
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}
      <div className="u-fixed-width">
        <hr className="u-no-margin--bottom" />
      </div>
      {githubData !== null && (
        <Strip shallow>
          <p>
            Your repo needs a snapcraft.yaml file, so that Snapcraft can make it
            buildable, installable, and runnable.
          </p>
          <label className="p-form__label">Select a repository:</label>
          <Row>
            <Col size={4}>
              <Select
                defaultValue=""
                options={[
                  { label: "Select organization", value: "" },
                  {
                    label: githubData.github_user.name,
                    value: githubData?.github_user.login,
                  },
                  ...getOrgs(),
                ]}
                onChange={async (e) => {
                  if (e.target.value) {
                    setReposLoading(true);

                    const org = e.target.value;

                    if (org === githubData.github_user.login) {
                      getRepos();
                    } else {
                      getRepos(org);
                    }

                    setSelectedOrg(org);
                  } else {
                    setSelectedOrg(null);
                  }
                }}
              />
            </Col>
            <Col
              size={6}
              className={`p-form-validation ${getValidationStatusClassName()}`}
              style={{ position: "relative" }}
            >
              <input
                type="text"
                list="repo-list"
                placeholder="Search your repos"
                disabled={selectedOrg === null || validating}
                className="p-form-validation__input"
                onChange={async (e) => {
                  const searchTerm = e.target.value;

                  if (!searchTerm) {
                    setValidationError(false);
                    setValidRepo(false);
                  }

                  const selectedRepo = repos.find(
                    (repo: Repo) => repo.name === searchTerm,
                  );

                  setSelectedRepo(selectedRepo);

                  if (selectedRepo) {
                    validateRepo(selectedRepo);
                  }
                }}
              />
              {reposLoading ||
                (validating && (
                  <span className="p-icon-container">
                    <i className="p-icon--spinner u-animation--spin" />
                  </span>
                ))}
              <datalist id="repo-list">
                {repos.map((repo: Repo) => (
                  <option value={repo.name} key={repo.name} />
                ))}
              </datalist>
            </Col>
            <Col size={2}>
              {validRepo === true && (
                <Button
                  appearance="positive"
                  disabled={building}
                  onClick={async () => {
                    setBuilding(true);
                    const formData = new FormData();
                    formData.set("csrf_token", window.CSRF_TOKEN);
                    if (selectedRepo) {
                      formData.set(
                        "github_repository",
                        selectedRepo.nameWithOwner,
                      );
                    }

                    const response = await fetch(`/api/${snapId}/builds`, {
                      method: "POST",
                      body: formData,
                    });

                    console.log(response);

                    if (!response.ok) {
                      throw new Error("There was a problem linking this repo");
                    }

                    const responseData = await response.json();
                  }}
                >
                  Start building
                </Button>
              )}
              {validationError && (
                <Button
                  className="p-tooltip--btm-center"
                  aria-describedby="recheck-tooltip"
                  onClick={() => {
                    validateRepo(selectedRepo);
                  }}
                >
                  <i className="p-icon--restart"></i>
                  <span
                    className="p-tooltip__message"
                    role="tooltip"
                    id="recheck-tooltip"
                  >
                    Re-check
                  </span>
                </Button>
              )}
            </Col>
          </Row>
          {validationError && (
            <div className="u-fixed-width">
              <p>{validationMessage}</p>
              <p>
                <a href="/docs/creating-a-snap">Learn the basics</a>, or{" "}
                <a href="https://github.com/canonical/juju-dashboard-1/new/master?filename=snap%2Fsnapcraft.yaml&value=%0A%20%20%23%20After%20registering%20a%20name%20on%20build.snapcraft.io%2C%20commit%20an%20uncommented%20line%3A%0A%20%20%23%20name%3A%20steve-test-snap%0A%20%20version%3A%20%270.1%27%20%23%20just%20for%20humans%2C%20typically%20%271.2%2Bgit%27%20or%20%271.3.2%27%0A%20%20summary%3A%20Single-line%20elevator%20pitch%20for%20your%20amazing%20snap%20%23%2079%20char%20long%20summary%0A%20%20description%3A%20%7C%0A%20%20%20%20This%20is%20my-snap%27s%20description.%20You%20have%20a%20paragraph%20or%20two%20to%20tell%20the%0A%20%20%20%20most%20important%20story%20about%20your%20snap.%20Keep%20it%20under%20100%20words%20though%2C%0A%20%20%20%20we%20live%20in%20tweetspace%20and%20your%20description%20wants%20to%20look%20good%20in%20the%20snap%0A%20%20%20%20store.%0A%0A%20%20grade%3A%20devel%20%23%20must%20be%20%27stable%27%20to%20release%20into%20candidate%2Fstable%20channels%0A%20%20confinement%3A%20devmode%20%23%20use%20%27strict%27%20once%20you%20have%20the%20right%20plugs%20and%20slots%0A%0A%20%20parts%3A%0A%20%20%20%20my-part%3A%0A%20%20%20%20%20%20%23%20See%20%27snapcraft%20plugins%27%0A%20%20%20%20%20%20plugin%3A%20nil%0A%20%20">
                  get started with a template
                </a>
                .
              </p>
              <p>
                Don't have snapcraft?{" "}
                <a href="/docs/snapcraft-overview">
                  Install it on your own PC for testing
                </a>
                .
              </p>
            </div>
          )}
        </Strip>
      )}
      <div className="u-fixed-width">
        <hr className="u-no-margin--bottom" />
      </div>
      <Strip shallow>
        <div className="u-fixed-width">
          <h4>If you can't find a repository …</h4>
          <p>
            Want to <strong>use a private repo</strong>? We're working hard on
            making these buildable.
          </p>
          <p>
            <strong>Don't have admin permission</strong>? Ask a repo admin to
            add it instead, and it will show up in your repo list too.
          </p>
          <p>
            <strong>Missing an organization</strong>?
          </p>
          <a
            className="p-button"
            href="https://github.com/settings/applications"
          >
            Review organization access
          </a>
        </div>
      </Strip>
    </>
  );
}

export default BuildsLoggedIn;
