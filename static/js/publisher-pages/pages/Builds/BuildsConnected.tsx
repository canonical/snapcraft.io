import { useState } from "react";
import { useQuery } from "react-query";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { useParams } from "react-router-dom";
import {
  Strip,
  Button,
  Modal,
  Row,
  Col,
  MainTable,
} from "@canonical/react-components";

import { githubDataState, buildRepoConnectedState } from "../../state/atoms";

import type { GithubData } from "../../types";

function BuildsConnected(): JSX.Element {
  const { snapId } = useParams();
  const githubData = useRecoilValue<GithubData | null>(githubDataState);
  const setRepoConnected = useSetRecoilState(buildRepoConnectedState);
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
                      content: build.id,
                    },
                    { content: build.arch_tag },
                    { content: build.duration },
                    {
                      content: build.status,
                      style: { textTransform: "capitalize" },
                    },
                    { content: build.datebuilt },
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
                onClick={async () => {
                  const formData = new FormData();
                  formData.set("csrf_token", window.CSRF_TOKEN);
                  const response = await fetch(
                    `/api/${snapId}/builds/disconnect`,
                    {
                      method: "POST",
                      body: formData,
                    },
                  );

                  if (response.ok) {
                    setRepoConnected(false);
                  }
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

export default BuildsConnected;
