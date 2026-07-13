import { useEffect, useState, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useQueryClient } from "react-query";
import {
  useParams,
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { Notification, Icon, Button, Modal } from "@canonical/react-components";

import { useRemodels } from "../../hooks";
import { remodelsListState } from "../../state/remodelsState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";
import { setPageTitle, isClosedPanel } from "../../utils";
import { PortalEntrance } from "../Portals/Portals";

import RemodelTable from "./RemodelTable";
import ConfigureRemodelForm from "./ConfigureRemodelForm";

import type { UseQueryResult } from "react-query";
import type { Remodel, RemodelResponse, ApiResponse } from "../../types/shared";

const getRemodelRowId = (remodel: Remodel): string => {
  const serial = remodel["from-serial"] ?? "all-serials";
  return `${remodel["from-model"]}:${remodel["to-model"]}:${serial}`;
};

function Remodel(): React.JSX.Element {
  const { id, modelId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const brandId = useAtomValue(brandIdState);
  const remodels = useAtomValue(remodelsListState);
  const queryClient = useQueryClient();
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const cursorHistory = useRef<Array<string | null>>([]);

  const pageSizeParam = searchParams.get("page-size");
  const parsedPageSize = pageSizeParam ? parseInt(pageSizeParam) : NaN;
  const pageSize = Number.isInteger(parsedPageSize) ? parsedPageSize : 25;

  const {
    isLoading,
    isError,
    error,
    data,
    refetch,
  }: UseQueryResult<ApiResponse<RemodelResponse>, Error> = useRemodels(
    brandId,
    {
      fromModel: modelId,
      pageSize: pageSize,
      page: currentCursor,
    },
  );
  const setRemodels = useSetAtom(remodelsListState);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(
    "New remodel configured",
  );
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editedDescriptions, setEditedDescriptions] = useState<
    Record<string, string>
  >({});
  const [remodelsToDelete, setRemodelsToDelete] = useState<Remodel[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const brandStore = useAtomValue(brandStoreState(id));
  const navigate = useNavigate();

  const handleEditChange = (rowId: string, value: string) => {
    setEditedDescriptions((previous) => ({
      ...previous,
      [rowId]: value,
    }));
  };

  const handleEditCancel = (rowId: string) => {
    setEditedDescriptions((previous) => {
      const updated = { ...previous };
      delete updated[rowId];
      return updated;
    });
  };

  const handleBulkDeleteRemodels = async () => {
    setIsBulkDeleting(true);

    const deletePayload = remodelsToDelete.map((remodel) => ({
      "from-model": remodel["from-model"],
      "to-model": remodel["to-model"],
      "from-serial": remodel["from-serial"],
    }));

    try {
      const response = await fetch(
        `/api/store/${brandId}/models/remodel-allowlist`,
        {
          method: "DELETE",
          body: JSON.stringify(deletePayload),
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": window.CSRF_TOKEN,
          },
        },
      );
      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Unable to delete remodels");
      }

      const count = remodelsToDelete.length;
      setNotificationMessage(`${count} remodel${count > 1 ? "s" : ""} deleted`);
      setShowNotification(true);
      setRemodelsToDelete([]);
      setShowBulkDeleteModal(false);

      await queryClient.invalidateQueries({ queryKey: ["remodels"] });

      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete remodels",
      );
      setShowErrorNotification(true);
      setTimeout(() => {
        setShowErrorNotification(false);
      }, 5000);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleUpdateRemodel = async (remodel: Remodel) => {
    const rowId = getRemodelRowId(remodel);
    const description = editedDescriptions[rowId] ?? remodel["description"];

    setIsSavingEdit(true);

    const patchPayload = {
      "from-model": remodel["from-model"],
      "to-model": remodel["to-model"],
      "from-serial": remodel["from-serial"],
      description,
    };

    try {
      const response = await fetch(
        `/api/store/${brandId}/models/remodel-allowlist`,
        {
          method: "PATCH",
          body: JSON.stringify(patchPayload),
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": window.CSRF_TOKEN,
          },
        },
      );
      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.message || "Unable to update remodel");
      }

      setNotificationMessage("Remodel updated");
      setShowNotification(true);
      setEditedDescriptions((previous) => {
        const updated = { ...previous };
        delete updated[rowId];
        return updated;
      });

      await queryClient.invalidateQueries({ queryKey: ["remodels"] });

      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update remodel",
      );
      setShowErrorNotification(true);
      setTimeout(() => {
        setShowErrorNotification(false);
      }, 5000);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePageForward = () => {
    cursorHistory.current.push(currentCursor);
    setCurrentCursor(nextCursor);
  };

  const handlePageBack = () => {
    const lastCursor = cursorHistory.current.pop();
    setCurrentCursor(lastCursor || null);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    // Need to reset current page when changing page size
    // because otherwise the cursor history gets out of sync
    setCurrentCursor(null);
    cursorHistory.current = [];
    setSearchParams((params) => {
      params.set("page-size", newPageSize.toString());
      return params;
    });
  };

  brandStore
    ? setPageTitle(`Remodels in ${brandStore.name}`)
    : setPageTitle("Remodels");

  useEffect(() => {
    if (isLoading || isError) {
      return;
    }

    if (data) {
      setRemodels(data.data?.allowlist || []);
      setNextCursor(data.data?.["next-cursor"] || null);
    }
  }, [isLoading, isError, data, brandId, id]);

  return (
    <>
      <div className="u-fixed-width u-flex-column u-flex-grow">
        {isError && error && (
          <Notification severity="negative">
            Error: {error.message}
          </Notification>
        )}
        {isLoading ? (
          <p>
            <Icon name="spinner" className="u-animation--spin" />
            &nbsp;Fetching remodels...
          </p>
        ) : data && data.success === false ? (
          <Notification severity="caution">
            {data.message || "Unable to fetch remodels"}
          </Notification>
        ) : (
          <>
            <div className="u-fixed-width u-align--right">
              <Button
                disabled={remodelsToDelete.length === 0 || isBulkDeleting}
                onClick={() => setShowBulkDeleteModal(true)}
                className={isBulkDeleting ? "has-icon" : ""}
              >
                {isBulkDeleting ? (
                  <>
                    <Icon
                      name="spinner"
                      className="u-animation--spin is-light"
                    />
                    &nbsp;Deleting...
                  </>
                ) : remodelsToDelete.length > 1 ? (
                  `Delete ${remodelsToDelete.length} remodels`
                ) : (
                  "Delete remodel"
                )}
              </Button>

              <Link
                className={`p-button--positive ${isError && !data ? "is-disabled" : ""}`}
                to={`/admin/${id}/models/${modelId}/remodel/configure`}
              >
                Configure remodels
              </Link>
            </div>

            <div className="u-flex-column u-flex-grow">
              {data && (
                <RemodelTable
                  remodels={remodels}
                  handlePageForward={handlePageForward}
                  handlePageBack={handlePageBack}
                  handlePageSizeChange={handlePageSizeChange}
                  forwardDisabled={!nextCursor}
                  backDisabled={
                    cursorHistory.current.length < 1 || currentCursor === null
                  }
                  pageSize={pageSize}
                  isSavingEdit={isSavingEdit}
                  editedDescriptions={editedDescriptions}
                  onEditChange={handleEditChange}
                  onEditSave={handleUpdateRemodel}
                  onEditCancel={handleEditCancel}
                  remodelsToDelete={remodelsToDelete}
                  setRemodelsToDelete={setRemodelsToDelete}
                />
              )}
            </div>
          </>
        )}
      </div>

      <PortalEntrance name="notification">
        {showNotification && (
          <div className="u-fixed-width">
            <Notification
              severity="positive"
              onDismiss={() => {
                setShowNotification(false);
              }}
            >
              {notificationMessage}
            </Notification>
          </div>
        )}

        {showErrorNotification && (
          <div className="u-fixed-width">
            <Notification
              severity="negative"
              onDismiss={() => {
                setShowErrorNotification(false);
              }}
            >
              {errorMessage || "Unable to configure remodel"}
            </Notification>
          </div>
        )}
      </PortalEntrance>
      <PortalEntrance name="modal">
        {showBulkDeleteModal && (
          <Modal
            close={() => {
              if (!isBulkDeleting) {
                setShowBulkDeleteModal(false);
              }
            }}
            title={
              remodelsToDelete.length > 1
                ? `Delete ${remodelsToDelete.length} remodels`
                : "Delete remodel"
            }
            buttonRow={
              <>
                <Button
                  className="u-no-margin--bottom"
                  disabled={isBulkDeleting}
                  onClick={() => setShowBulkDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="u-no-margin--bottom u-no-margin--right"
                  appearance="negative"
                  disabled={isBulkDeleting}
                  onClick={() => {
                    handleBulkDeleteRemodels();
                  }}
                >
                  {isBulkDeleting ? (
                    <>
                      <Icon
                        name="spinner"
                        className="u-animation--spin is-light"
                      />
                      &nbsp;Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </>
            }
          >
            {remodelsToDelete.length > 1 && (
              <ul>
                {remodelsToDelete.map((remodel) => {
                  const rowId = getRemodelRowId(remodel);
                  return (
                    <li key={rowId}>
                      <strong>
                        {remodel["from-model"]} → {remodel["to-model"]}
                      </strong>
                      {remodel["from-serial"] && (
                        <> (Serial: {remodel["from-serial"]})</>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p>
              Are you sure you want to delete{" "}
              {remodelsToDelete.length > 1 ? "these remodels" : "this remodel"}?
              <br />
              This action cannot be undone.
            </p>
          </Modal>
        )}
      </PortalEntrance>
      <PortalEntrance name="aside">
        <div
          className={`l-aside__overlay ${
            isClosedPanel(location.pathname, "configure") ? "u-hide" : ""
          }`}
          onClick={() => {
            navigate(`/admin/${id}/models/${modelId}/remodel`);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate(`/admin/${id}/models/${modelId}/remodel`);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Return to remodels"
        ></div>
        <aside
          className={`l-aside ${
            isClosedPanel(location.pathname, "configure") ? "is-collapsed" : ""
          }`}
        >
          <ConfigureRemodelForm
            refetch={refetch}
            setShowNotification={setShowNotification}
            setNotificationMessage={setNotificationMessage}
            setShowErrorNotification={setShowErrorNotification}
            setErrorMessage={setErrorMessage}
          />
        </aside>
      </PortalEntrance>
    </>
  );
}

export default Remodel;
