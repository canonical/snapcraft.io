import {
  ConfirmationModal,
  MainTable,
  Notification,
  Row,
  Strip,
  Tooltip,
} from "@canonical/react-components";
import { ISnap } from "../../types";
import { useState } from "react";
import { PAGE_NUMBER } from "../../types/constants";

export const RegisteredSnaps = ({
  snaps,
  currentUser,
  refetchSnaps,
}: {
  snaps: ISnap[];
  currentUser: string;
  refetchSnaps: () => void;
}) => {
  const [unregisterSnapModal, setUnregisterSnapModal] = useState<string | null>(
    null
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
                <a href={`/${snap.snapName}/listing`}>{snap.snapName}</a>
                {isDisputePending && (
                  <>
                    &nbsp;
                    <i className="p-icon--warning p-snapcraft-dispute-list__icon"></i>
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
                className="p-button--base u-no-margin--bottom"
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
                    className="u-no-margin--bottom u-no-margin--right"
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
              <button className="p-button--link u-no-margin--bottom">
                <a href="/docs/releasing-your-app" target="_blank">
                  Publish to this name
                </a>
              </button>
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
    } catch (error) {
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
            <div style={{ alignItems: "center", display: "flex" }}>
              <i
                className="p-icon--warning"
                style={{ marginRight: "0.5rem", fontSize: "2rem" }}
              ></i>
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
            <span data-js="package-name">{unregisterSnapModal}</span>”?
            <br />
            This name will be removed from your registered names and become
            available to others. This action is permanent and cannot be undone.
          </p>
        </ConfirmationModal>
      )}

      <Strip shallow>
        <Row>
          <h3 className="p-heading--5">Registered names ({snaps.length})</h3>
        </Row>
      </Strip>

      {isError && (
        <div className="u-fixed-width">
          <Notification severity="negative" title="Error:">
            Something went wrong. Please try again later.
          </Notification>
        </div>
      )}

      <Row>
        <MainTable rows={getData()} paginate={PAGE_NUMBER} />
      </Row>
    </>
  );
};
