import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Accordion,
  ConfirmationModal,
  MainTable,
  Notification,
  Row,
  Tooltip,
} from "@canonical/react-components";
import { ITEMS_PER_PAGE } from "../../constants";

import type { ISnap } from "../../types";

function RegisteredSnaps({
  snaps,
  currentUser,
  refetchSnaps,
}: {
  snaps: ISnap[];
  currentUser: string;
  refetchSnaps: () => void;
}): React.JSX.Element {
  const [unregisterSnapModal, setUnregisterSnapModal] = useState<string | null>(
    null,
  );
  const [isError, setIsError] = useState<boolean>(false);
  const [unregisterLoading, setUnregisterLoading] = useState<boolean>(false);

  const closeModal = (): void => {
    setUnregisterSnapModal(null);
  };

  const PENDING_STATUS_LABELS: Record<string, string> = {
    DisputePending: "Name dispute in progress",
    ReviewPending: "Review pending",
  };

  const getStatusColumnValue = (snapStatus: string) => {
    const label = PENDING_STATUS_LABELS[snapStatus];

    if (label) {
      return <span className="p-snapcraft-pending-list__muted">({label})</span>;
    }

    return (
      <Link to="/docs/releasing-your-app" target="_blank">
        Publish to this name
      </Link>
    );
  };

  const getData = () => {
    return snaps.map((snap) => {
      const isUsersSnap = snap.publisher.username === currentUser;

      return {
        columns: [
          {
            width: "25%",
            content: (
              <>
                {snap.snapName}
                {PENDING_STATUS_LABELS[snap.status] && (
                  <>
                    &nbsp;
                    <i
                      className="p-icon--warning p-snapcraft-pending-list__icon"
                      aria-label={PENDING_STATUS_LABELS[snap.status]}
                    ></i>
                  </>
                )}
              </>
            ),
          },
          {
            content: "",
          },
          {
            content: "",
          },
          {
            content: isUsersSnap ? (
              <button
                className="p-button--base u-no-margin--bottom is-dense"
                onClick={() => {
                  setUnregisterSnapModal(snap.snapName);
                }}
              >
                Unregister
              </button>
            ) : (
              <>
                <Tooltip
                  message={"Snaps can only be unregistered by their owner."}
                >
                  <button
                    className="u-no-margin--bottom u-no-margin--right is-dense"
                    disabled
                  >
                    Unregister
                  </button>
                </Tooltip>
              </>
            ),
          },
          {
            content: getStatusColumnValue(snap.status),
            className: "u-align--right",
          },
        ],
        className: "p-snapcraft-pending-list__item",
      };
    });
  };

  const unregisterPackage = async () => {
    setUnregisterLoading(true);
    setIsError(false);
    try {
      const response = await fetch(`/packages/${unregisterSnapModal}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": window.CSRF_TOKEN,
        },
      });
      if (response.ok) {
        void refetchSnaps();
      } else {
        setIsError(true);
      }
    } catch (_) {
      setIsError(true);
    } finally {
      setUnregisterLoading(false);
      closeModal();
    }
  };

  return (
    <>
      {unregisterSnapModal && (
        <ConfirmationModal
          title={
            <div className="p-snap-list__confirmation-modal">
              <i className="p-icon--warning p-snap-list__confirmation-modal-icon"></i>
              Unregister “<span>{unregisterSnapModal}</span>”
            </div>
          }
          confirmButtonLabel="Unregister"
          onConfirm={() => {
            void unregisterPackage();
          }}
          close={closeModal}
          confirmButtonLoading={unregisterLoading}
        >
          <p>
            Are you sure you want to unregister “
            <span>{unregisterSnapModal}</span>”?
            <br />
            This name will be removed from your registered names and become
            available to others. This action is permanent and cannot be undone.
          </p>
        </ConfirmationModal>
      )}

      {isError && (
        <div className="u-fixed-width">
          <Notification severity="negative" title="Error:">
            Something went wrong. Please try again later.
          </Notification>
        </div>
      )}

      <Row>
        <Accordion
          className="accordion-bold-titles"
          sections={[
            {
              key: "registered-snap-names",
              title: `Registered snap names (${snaps.length})`,
              content: <MainTable rows={getData()} paginate={ITEMS_PER_PAGE} />,
            },
          ]}
          expanded="registered-snap-names"
        />
      </Row>
    </>
  );
}

export default RegisteredSnaps;
