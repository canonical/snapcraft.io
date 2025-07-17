import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { useQuery } from "react-query";
import { useAtomValue } from "jotai";
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

import DisconnectRepoActions from "./DisconnectRepoActions";

import { githubDataState } from "../../state/buildsState";

function RepoConnected({
  autoTriggerBuild,
  setAutoTriggerBuild,
}: {
  autoTriggerBuild: boolean;
  setAutoTriggerBuild: Dispatch<SetStateAction<boolean>>;
}): React.JSX.Element {
  const { snapId } = useParams();
  const githubData = useAtomValue(githubDataState);
  const [disconnectModalOpen, setDisconnectModalOpen] =
    useState<boolean>(false);
  const [triggeringBuild, setTriggeringBuild] = useState<boolean>(false);
  const { isLoading, isFetched, data, refetch } = useQuery({
    queryKey: ["repo"],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/builds`);
      const data = await response.json();
      return data.data;
    },
    onSettled: () => {
      setTriggeringBuild(false);
    },
  });

  const formatDurationString = (duration?: string): string => {
    if (!duration) {
      return "-";
    }

    const durationParts = duration.split(":");

    return formatDuration({
      hours: parseInt(durationParts[0]),
      minutes: parseInt(durationParts[1]),
      seconds: Math.floor(parseInt(durationParts[2])),
    });
  };

  const formatStatus = (status: string): React.JSX.Element => {
    switch (status) {
      case "never_built":
        return <>Never built</>;
      case "building_soon":
        return <>Building soon</>;
      case "wont_release":
        return <>Won't release</>;
      case "released":
        return <>Released</>;
      case "release_failed":
        return <>Release failed</>;
      case "releasing_soon":
        return <>Releasing soon</>;
      case "in_progress":
        return (
          <>
            <i className="p-icon--spinner u-animation--spin" />
            In progress
          </>
        );
      case "failed_to_build":
        return <>Failed to build</>;
      case "cancelled":
        return <>Cancelled</>;
      case "unknown":
        return <>Unknown</>;
      case "ERROR":
        return <>Error</>;
      case "SUCCESS":
        return <>Success</>;
      case "IDLE":
        return <>Idle</>;
      default:
        return <>{status}</>;
    }
  };

  async function trigger() {
    const response = await fetch(`/api/${snapId}/builds/trigger-build`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": window.CSRF_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to trigger new build");
    }

    refetch();
    setAutoTriggerBuild(false);
  }

  if (autoTriggerBuild) {
    trigger();
  }

  useEffect(() => {
    setInterval(() => {
      refetch();
    }, 30000);
  }, []);

  return (
    <>
      <Strip shallow className="u-no-padding--top u-no-padding--bottom">
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
      <Row>
        <Col size={6}>
          <h2 className="p-heading--4">Latest builds</h2>
        </Col>
        <Col size={6} className="u-align--right">
          <Button
            disabled={triggeringBuild}
            onClick={async () => {
              setTriggeringBuild(true);
              const response = await fetch(
                `/api/${snapId}/builds/trigger-build`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": window.CSRF_TOKEN,
                  },
                },
              );

              if (!response.ok) {
                throw new Error("Unable to trigger new build");
              }

              refetch();
            }}
          >
            {triggeringBuild ? (
              <>
                <i className="p-icon--spinner u-animation--spin"></i>
                &nbsp;Requesting
              </>
            ) : (
              "Trigger new build"
            )}
          </Button>
        </Col>
      </Row>
      {isLoading && <>Waiting for builds...</>}
      {isFetched && data && (
        <>
          <MainTable
            sortable
            headers={[
              { content: "ID", sortKey: "id" },
              { content: "Architecture", sortKey: "arch" },
              { content: "Build duration", sortKey: "duration" },
              {
                content: "Result",
                sortKey: "result",
                className: "p-table__cell--icon-placeholder",
              },
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
                        <Link to={`/${snapId}/builds/${build.id}`}>
                          {build.id}
                        </Link>
                      ),
                    },
                    { content: build.arch_tag },
                    { content: formatDurationString(build.duration) },
                    {
                      content: formatStatus(build.status),
                      className: "p-table__cell--icon-placeholder",
                    },
                    {
                      content: build.datebuilt
                        ? formatDistanceToNow(build.datebuilt, {
                            addSuffix: true,
                          })
                        : "-",
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
            <DisconnectRepoActions
              setDisconnectModalOpen={setDisconnectModalOpen}
              githubData={githubData}
            />
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
