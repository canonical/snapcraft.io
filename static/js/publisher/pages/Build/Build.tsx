import { useParams, Link } from "react-router-dom";
import { useQuery } from "react-query";
import { Strip, Row, Col, MainTable } from "@canonical/react-components";
import { formatDistanceToNow } from "date-fns";

import SectionNav from "../../components/SectionNav";

import {
  formatBuildStatus,
  formatDurationString,
  setPageTitle,
} from "../../utils";
import { GitCommitLink } from "../../utils/formatGitCommit";

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
    refetchOnWindowFocus: false,
  });

  const build = data?.snap_build;
  const isDataLoading =
    isLoading ||
    isFetching ||
    !data ||
    (build && build.id.toString() !== buildId);

  setPageTitle(`Build ${buildId} for ${snapId}`);

  return (
    <>
      <h1 className="p-heading--4" aria-live="polite">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /{" "}
        <Link to={`/${snapId}/builds`}>Builds</Link> / Build #{buildId}
      </h1>
      <SectionNav activeTab="builds" snapName={snapId} />
      {isDataLoading && (
        <Strip shallow>
          <p>
            <i className="p-icon--spinner u-animation--spin"></i>&nbsp;Loading{" "}
            {snapId} build data
          </p>
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
