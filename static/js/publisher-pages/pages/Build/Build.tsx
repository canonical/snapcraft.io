import { useParams, Link } from "react-router-dom";
import { useQuery } from "react-query";
import { Strip, Row, Col, MainTable } from "@canonical/react-components";
import { formatDistanceToNow } from "date-fns";

import SectionNav from "../../components/SectionNav";

function Build(): JSX.Element {
  const { buildId, snapId } = useParams();
  const { data, isFetched, isLoading } = useQuery({
    queryKey: ["build"],
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
  });

  return (
    <>
      <h1 className="p-heading--4">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /{" "}
        <Link to={`/${snapId}/builds`}>Builds</Link> / Build #{buildId}
      </h1>
      <SectionNav activeTab="builds" snapName={snapId} />
      {isLoading && (
        <Strip shallow>
          <p>
            <i className="p-icon--spinner u-animation--spin"></i>&nbsp;Loading{" "}
            {snapId} build data
          </p>
        </Strip>
      )}
      <Strip shallow>
        {isFetched && data && (
          <>
            <MainTable
              headers={[
                { content: "id" },
                { content: "Architecture" },
                { content: "Build duration" },
                { content: "Result" },
                { content: "Build finished", className: "u-align-text--right" },
              ]}
              rows={[
                {
                  columns: [
                    { content: buildId },
                    { content: data.snap_build.arch_tag },
                    { content: data.snap_build.duration },
                    { content: data.snap_build.status },
                    {
                      content: formatDistanceToNow(data.snap_build.datebuilt, {
                        addSuffix: true,
                      }),
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
                {isFetched && data && (
                  <a
                    target="_blank"
                    href={data.snap_build.logs}
                    className="p-button"
                    rel="noreferrer"
                  >
                    View raw
                  </a>
                )}
              </Col>
            </Row>
            <pre>{data.raw_logs}</pre>
          </>
        )}
      </Strip>
      <div id="footer"></div>
    </>
  );
}

export default Build;
