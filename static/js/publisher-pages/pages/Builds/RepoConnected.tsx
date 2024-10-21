import { useState } from "react";
import { useQuery } from "react-query";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useParams, Link } from "react-router-dom";
import { formatDistanceToNow, formatDuration } from "date-fns";
import {
  Strip,
  Button,
  Modal,
  Row,
  Col,
  MainTable,
} from "@canonical/react-components";

import { buildRepoConnectedState, githubDataState } from "../../state/atoms";

function RepoConnected(): JSX.Element {
  const { snapId } = useParams();
  const setRepoConnected = useSetRecoilState(buildRepoConnectedState);
  const githubData = useRecoilValue(githubDataState);
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  const [disconnectModalOpen, setDisconnectModalOpen] =
    useState<boolean>(false);
  const { isLoading, isFetched, data } = useQuery({
    queryKey: ["repo"],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/builds`);
      const data = await response.json();
      return data.data;
    },
  });

  const formatDurationString = (duration: string): string => {
    const durationParts = duration.split(":");

    return formatDuration({
      hours: parseInt(durationParts[0]),
      minutes: parseInt(durationParts[1]),
      seconds: Math.floor(parseInt(durationParts[2])),
    });
  };

  return (
    <>
      <Strip shallow className="u-no-padding--top">
        <div className="snapcraft-p-sticky js-sticky-bar">
          <div className="u-fixed-width">
            {githubData !== null && (
              <p>
                Your snap is linked to:{" "}
                <a href={`https://github.com/${githubData.github_repository}`}>
                  {githubData.github_repository}
                </a>{" "}
                |{" "}
                <Button
                  appearance="link"
                  onClick={() => {
                    setDisconnectModalOpen(true);
                  }}
                >
                  Disconnect repo
                </Button>
              </p>
            )}
          </div>
        </div>
      </Strip>
      {isLoading && (
        <Strip shallow>
          <p>
            <i className="p-icon--spinner u-animation--spin"></i>&nbsp;Loading{" "}
            {snapId} builds
          </p>
        </Strip>
      )}
      {isFetched && data && data.snap_builds.length > 0 && (
        <>
          <Row>
            <Col size={6}>
              <h2 className="p-heading--4">Latest builds</h2>
            </Col>
            <Col size={6} className="u-align--right">
              <Button>Trigger new build</Button>
            </Col>
          </Row>
          <MainTable
            sortable
            headers={[
              { content: "ID", sortKey: "id" },
              { content: "Architecture", sortKey: "arch" },
              { content: "Build duration", sortKey: "duration" },
              { content: "Result", sortKey: "result" },
              {
                content: "Build finished",
                sortKey: "status",
                className: "u-align--right",
              },
            ]}
            rows={data.snap_builds.map(
              (build: {
                id: string;
                arch_tag: string;
                duration: string;
                status: string;
                datebuilt: string;
              }) => {
                return {
                  columns: [
                    {
                      content: (
                        <Link to={`/admin/${snapId}/models/${build.id}`}>
                          {build.id}
                        </Link>
                      ),
                    },
                    { content: build.arch_tag },
                    { content: formatDurationString(build.duration) },
                    {
                      content: build.status,
                      style: { textTransform: "capitalize" },
                    },
                    {
                      content: formatDistanceToNow(build.datebuilt, {
                        addSuffix: true,
                      }),
                      className: "u-align--right",
                    },
                  ],
                };
              },
            )}
          />
        </>
      )}
      {disconnectModalOpen && (
        <Modal
          close={() => {
            setDisconnectModalOpen(false);
          }}
          title="Disconnecting your repository"
          buttonRow={
            <>
              <Button
                className="u-no-margin--bottom"
                onClick={() => {
                  setDisconnectModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                appearance="positive"
                className="u-no-margin--bottom u-no-margin--right"
                disabled={disconnecting}
                onClick={async () => {
                  setDisconnecting(true);
                  const formData = new FormData();
                  formData.set("csrf_token", window.CSRF_TOKEN);
                  const response = await fetch(
                    `/api/${snapId}/builds/disconnect`,
                    {
                      method: "POST",
                      body: formData,
                    },
                  );

                  if (!response.ok) {
                    if (githubData !== null) {
                      setRepoConnected(false);
                    }
                  }

                  setRepoConnected(false);
                  setDisconnectModalOpen(false);
                  setDisconnecting(false);
                }}
              >
                Confirm
              </Button>
            </>
          }
        >
          <p>
            By disconnecting this repository from your snap, the following will
            occur:
          </p>
          <ul>
            <li>
              Previous builds for this snap will disappear from the Builds page
            </li>
            <li>
              You will be able to continue to release your previous revisions on
              the Releases tab
            </li>
          </ul>
          <p>
            Do you wish to{" "}
            <strong>continue disconnecting your repository?</strong>
          </p>
        </Modal>
      )}
    </>
  );
}

export default RepoConnected;
