import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import { useParams } from "react-router-dom";
import { useSetAtom } from "jotai";
import {
  Strip,
  Row,
  Col,
  Select,
  Button,
  Input,
} from "@canonical/react-components";

import { buildRepoConnectedState } from "../../state/buildsState";

import type { GithubData } from "../../types/";

type Repo = { name: string; nameWithOwner: string };

type Props = {
  githubData: GithubData;
  setAutoTriggerBuild: Dispatch<SetStateAction<boolean>>;
};

function generateYamlTemplateUrl(
  org: string | null,
  repo: string | undefined,
  branch: string | null,
  snapId: string,
) {
  if (!org || !repo) {
    return;
  }

  const url = `https://github.com/${org}/${repo}/new/${branch}`;
  const searchParams = new URLSearchParams();
  const templateContent = `# After registering a name on snapcraft.io, commit an uncommented line:
# name: ${snapId}
version: '0.1' # just for humans, typically '1.2+git' or '1.3.2'
summary: Single-line elevator pitch for your amazing snap # 79 char long summary
description: |
  This is my-snap's description. You have a paragraph or two to tell the
  most important story about your snap. Keep it under 100 words though,
  your description wants to look good in the snap
  store.
grade: devel # must be 'stable' to release into candidate/stable channels
confinement: devmode # use 'strict' once you have the right plugs and slots
parts:
  my-part:
    # See 'snapcraft plugins'
    plugin: nil`;

  searchParams.set("filename", "snap/snapcraft.yaml");
  searchParams.set("value", templateContent);

  return `${url}?${searchParams.toString()}`;
}

function RepoSelector({ githubData, setAutoTriggerBuild }: Props) {
  const { snapId } = useParams();
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repo | undefined>();
  const [building, setBuilding] = useState<boolean>(false);
  const setRepoConnected = useSetAtom(buildRepoConnectedState);
  const [validating, setValidating] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState<boolean>(false);
  const [validRepo, setValidRepo] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<boolean>(false);
  const [missingYaml, setMissingYaml] = useState<boolean>(false);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);

  const getRepoNameWithOwner = (repo: Repo) =>
    selectedOrg ? `${selectedOrg}/${repo.name}` : repo.nameWithOwner;

  const validateRepo = async (repo: Repo | undefined) => {
    setMissingYaml(false);

    if (!repo) {
      return;
    }

    setValidating(true);

    const repoName = getRepoNameWithOwner(repo);

    const response = await fetch(
      `/api/${snapId}/builds/validate-repo?repo=${repoName}`,
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
      setMissingYaml(false);
    } else {
      const error = responseData.error;

      if (error.type === "MISSING_YAML_FILE") {
        setMissingYaml(true);
        setDefaultBranch(responseData.data.default_branch);
      }

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
          value: org.login,
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

  const handleOrganizationChange = (e: ChangeEvent) => {
    const target = e.target as HTMLInputElement;

    if (target.value) {
      setReposLoading(true);

      const org = target.value;

      if (org === githubData.github_user.login) {
        getRepos();
      } else {
        getRepos(org);
      }

      setSelectedOrg(org);
    } else {
      setSelectedOrg(null);
    }
  };

  const handleRepoChange = (e: ChangeEvent) => {
    const target = e.target as HTMLInputElement;
    const searchTerm = target.value;

    if (!searchTerm) {
      setValidationError(false);
      setValidRepo(false);
    }

    const selectedRepo = repos.find((repo: Repo) => repo.name === searchTerm);

    setSelectedRepo(selectedRepo);

    if (selectedRepo) {
      validateRepo(selectedRepo);
    }
  };

  const connectRepo = async () => {
    setBuilding(true);
    const formData = new FormData();
    formData.set("csrf_token", window.CSRF_TOKEN);
    if (selectedRepo) {
      const repoName = getRepoNameWithOwner(selectedRepo);
      formData.set("github_repository", repoName);
    }

    const response = await fetch(`/api/${snapId}/builds`, {
      method: "POST",
      body: formData,
    });

    if (response) {
      setAutoTriggerBuild(true);
    }

    setRepoConnected(true);
  };

  return (
    <Strip shallow>
      <p>
        Your repo needs a snapcraft.yaml file, so that Snapcraft can make it
        buildable, installable, and runnable.
      </p>
      <Row>
        <Col size={4}>
          <Select
            label="Select an organization"
            defaultValue=""
            options={[
              { label: "Select organization", value: "" },
              {
                label:
                  githubData?.github_user.name || githubData?.github_user.login,
                value: githubData?.github_user.login,
              },
              ...getOrgs(),
            ]}
            onChange={handleOrganizationChange}
          />
        </Col>
        <Col
          size={6}
          className={`p-form-validation ${getValidationStatusClassName()}`}
          style={{ position: "relative" }}
        >
          <Input
            type="text"
            label="Select a repository"
            list="repo-list"
            placeholder="Search your repos"
            disabled={selectedOrg === null || validating}
            className="p-form-validation__input"
            onChange={handleRepoChange}
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
          <div style={{ display: "flex", alignItems: "end", height: "100%" }}>
            {validRepo === true && (
              <Button
                appearance="positive"
                disabled={building}
                onClick={() => {
                  connectRepo();
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
          </div>
        </Col>
      </Row>
      {missingYaml && (
        <div className="u-fixed-width">
          <p>{validationMessage}</p>
          <p>
            <a href="/docs/creating-a-snap">Learn the basics</a>, or{" "}
            <a
              target="_blank"
              rel="noreferrer"
              href={generateYamlTemplateUrl(
                selectedOrg,
                selectedRepo?.name,
                defaultBranch,
                snapId,
              )}
            >
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
  );
}

export default RepoSelector;
