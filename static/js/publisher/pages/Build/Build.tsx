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

function Build(): React.JSX.Element {
  const { buildId, snapId } = useParams();
  const { data, isFetched, isLoading, isFetching } = useQuery({
    queryKey: ["build", snapId, buildId],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/builds/${buildId}`);

      if (!response.ok) {
        throw new Error("There was a problem trying to fetch build data");
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error("There was a problem trying to fetch build data");
      }

      return responseData.data;
    },
    enabled: Boolean(snapId && buildId),
    refetchOnWindowFocus: false,
  });

  const build = data?.snap_build;
  const isDataLoading =
    isLoading ||
    isFetching ||
    !data ||
    (build?.id && build.id.toString() !== buildId);
  const hasBuild = Boolean(build?.id);
  const {
    data: logData,
    isLoading: isLogLoading,
    isError: isLogError,
  } = useQuery({
    queryKey: ["build-logs", snapId, buildId],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/builds/${buildId}/logs`);

      if (!response.ok) {
        throw new Error("There was a problem trying to fetch build logs");
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error("There was a problem trying to fetch build logs");
      }

      return responseData.data;
    },
    enabled: Boolean(snapId && buildId && !isDataLoading && build?.logs),
    refetchOnWindowFocus: false,
  });

  setPageTitle(`Build ${buildId} for ${snapId}`);

  return (
    <>
      {isDataLoading && <Loader text={`Loading ${snapId} build data`} />}

      {!isDataLoading && isFetched && !hasBuild && (
        <Notification severity="negative">
          There was a problem trying to fetch build data.
        </Notification>
      )}

      {!isDataLoading && isFetched && data && hasBuild && (
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
          {isLogLoading && <Loader text="Loading build log" />}
          {isLogError && (
            <Notification severity="negative">
              There was a problem trying to fetch build logs.
            </Notification>
          )}
          {!isLogLoading && !isLogError && <pre>{logData?.raw_logs}</pre>}
        </Strip>
      )}
      <div id="footer"></div>
    </>
  );
}

export default Build;
