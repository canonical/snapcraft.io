import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Accordion,
  MainTable,
  Notification,
  Row,
  Tooltip,
} from "@canonical/react-components";
import { Button, Modal } from "@canonical/react-ds-global";
import { ITEMS_PER_PAGE } from "../../constants";

import type { ISnap } from "../../types";

function RegisteredSnaps({
  snaps,
  currentUser,
  refetchSnaps,
  onUnregisterSuccess,
}: {
  snaps: ISnap[];
  currentUser: string;
  refetchSnaps: () => void;
  onUnregisterSuccess?: (snapName: string) => void;
}): React.JSX.Element {
  const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again later.";

  const [snapToUnregister, setSnapToUnregister] = useState<string | null>(null);
  const [error, setError] = useState({
    status: false,
    message: "",
  });
  const [unregisterLoading, setUnregisterLoading] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const closeModal = (): void => {
    setSnapToUnregister(null);
  };

  useEffect(() => {
    if (snapToUnregister) {
      dialogRef.current?.showModal();
    }
  }, [snapToUnregister]);

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
                  setSnapToUnregister(snap.snapName);
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
    const unregisteredSnapName = snapToUnregister;
    setUnregisterLoading(true);
    setError({ status: false, message: "" });
    try {
      const response = await fetch(`/packages/${snapToUnregister}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": window.CSRF_TOKEN,
        },
      });

      if (response.ok) {
        if (unregisteredSnapName) {
          onUnregisterSuccess?.(unregisteredSnapName);
        }
        void refetchSnaps();
      } else {
        const resData = await response.json();
        setError({
          status: true,
          message: resData?.error || DEFAULT_ERROR_MESSAGE,
        });
      }
    } catch (_) {
      setError({ status: true, message: DEFAULT_ERROR_MESSAGE });
    } finally {
      setUnregisterLoading(false);
      closeModal();
    }
  };

  return (
    <>
      {snapToUnregister && (
        <Modal ref={dialogRef} onClose={closeModal}>
          <Modal.Header>
            <div className="p-snap-list__confirmation-modal">
              <i className="p-icon--warning p-snap-list__confirmation-modal-icon"></i>
              Unregister "<span>{snapToUnregister}</span>"
            </div>
          </Modal.Header>
          <Modal.Content>
            <p>
              Are you sure you want to unregister “
              <span>{snapToUnregister}</span>”?
              <br />
              This name will be removed from your registered names and become
              available to others. This action is permanent and cannot be
              undone.
            </p>
          </Modal.Content>
          <Modal.Footer>
            <Button
              importance="secondary"
              onClick={closeModal}
              disabled={unregisterLoading}
            >
              Cancel
            </Button>
            <Button
              importance="primary"
              anticipation="destructive"
              loading={unregisterLoading}
              onClick={() => {
                void unregisterPackage();
              }}
            >
              Unregister snap
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {error.status && (
        <div className="u-fixed-width">
          <Notification severity="negative" title="Error:">
            {error.message}
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
