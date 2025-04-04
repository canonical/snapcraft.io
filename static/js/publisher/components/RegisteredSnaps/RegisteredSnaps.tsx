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

import { ISnap } from "../../types";
import { ITEMS_PER_PAGE } from "../../constants";

function RegisteredSnaps({
  snaps,
  currentUser,
  refetchSnaps,
}: {
  snaps: ISnap[];
  currentUser: string;
  refetchSnaps: () => void;
}) {
  const [unregisterSnapModal, setUnregisterSnapModal] = useState<string | null>(
    null,
  );
  const [isError, setIsError] = useState<boolean>(false);
  const [unregisterLoading, setUnregisterLoading] = useState<boolean>(false);

  const closeModal = () => setUnregisterSnapModal(null);

  const getData = () => {
    return snaps.map((snap) => {
      const isDisputePending = snap.status === "DisputePending";
      const isUsersSnap = snap.publisher.username === currentUser;

      return {
        columns: [
          {
            width: "25%",
            content: (
              <>
                {snap.snapName}
                {isDisputePending && (
                  <>
                    &nbsp;
                    <i
                      className="p-icon--warning p-snapcraft-dispute-list__icon"
                      aria-label="Name dispute in progress"
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
            content: isDisputePending ? (
              <span className="p-snapcraft-dispute-list__muted">
                (Name dispute in progress)
              </span>
            ) : (
              <Link to="/docs/releasing-your-app" target="_blank">
                Publish to this name
              </Link>
            ),
            className: "u-align--right",
          },
        ],
        className: "p-snapcraft-dispute-list__item",
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
