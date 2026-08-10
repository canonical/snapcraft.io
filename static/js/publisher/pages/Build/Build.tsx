import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import {
  Strip,
  Row,
  Col,
  MainTable,
  Notification,
} from "@canonical/react-components";
import { formatDistanceToNow } from "date-fns";

import {
  formatBuildStatus,
  formatDurationString,
  setPageTitle,
} from "../../utils";
import { GitCommitLink } from "../../utils/formatGitCommit";
import Loader from "../../components/Loader";

const genericBuildError = "There was a problem trying to fetch build data";

type BuildErrorResponse = {
  error?: {
    message?: string;
  };
  message?: string;
};

async function getBuildErrorMessage(response: Response): Promise<string> {
  try {
    const responseData = (await response.json()) as BuildErrorResponse;

    return (
      responseData.error?.message || responseData.message || genericBuildError
    );
  } catch {
    return genericBuildError;
  }
}

function Build(): React.JSX.Element {
  const { buildId, snapId } = useParams();
  const { data, error, isFetched, isLoading, isFetching, status } = useQuery({
    queryKey: ["build", snapId, buildId],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/builds/${buildId}`);

      if (!response.ok) {
        throw new Error(await getBuildErrorMessage(response));
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.error?.message || genericBuildError);
      }

      return responseData.data;
    },
    refetchOnWindowFocus: false,
  });

  const build = data?.snap_build;
  const hasError = status === "error";
  const errorMessage =
    error instanceof Error ? error.message : genericBuildError;
  const isDataLoading =
    !hasError &&
    (isLoading ||
      isFetching ||
      !data ||
      (build && build.id.toString() !== buildId));

  setPageTitle(`Build ${buildId} for ${snapId}`);

  return (
    <>
      {isDataLoading && <Loader text={`Loading ${snapId} build data`} />}

      {hasError && (
        <Strip shallow>
          <Notification severity="negative" title="Build data unavailable">
            {errorMessage}
          </Notification>
        </Strip>
      )}

      {!isDataLoading && isFetched && data && (
        <Strip shallow>
          <MainTable
            headers={[
              { content: "id" },
              { content: "Architecture" },
              { content: "Git commit" },
              { content: "Build duration" },
              { content: "Result" },
              { content: "Build finished", className: "u-align-text--right" },
            ]}
            rows={[
              {
                columns: [
                  { content: buildId },
                  { content: build.arch_tag },
                  {
                    content: (
                      <GitCommitLink
                        commitId={build.revision_id}
                        githubRepository={build.github_repository}
                      />
                    ),
                  },
                  { content: formatDurationString(build.duration) },
                  { content: formatBuildStatus(build.status) },
                  {
                    content: build.datebuilt
                      ? formatDistanceToNow(build.datebuilt, {
                          addSuffix: true,
                        })
                      : "-",
                    className: "u-align--right",
                  },
                ],
              },
            ]}
          />
          <Row>
            <Col size={6}>
              <h2 className="p-heading--4">Build log</h2>
            </Col>
            <Col size={6} className="u-align-text--right">
              <a className="p-button--base" href="#footer">
                Scroll to bottom
              </a>
              <a
                target="_blank"
                href={build.logs}
                className="p-button"
                rel="noreferrer"
              >
                View raw
              </a>
            </Col>
          </Row>
          <pre>{data.raw_logs}</pre>
        </Strip>
      )}
      <div id="footer"></div>
    </>
  );
}

export default Build;
