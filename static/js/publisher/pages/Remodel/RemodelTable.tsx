import { useState } from "react";
import {
  Button,
  Icon,
  MainTable,
  Modal,
  TablePaginationControls,
  Input,
} from "@canonical/react-components";
import { format } from "date-fns";

import type { Remodel } from "../../types/shared";

type Props = {
  remodels: Remodel[];
  handlePageForward: () => void;
  handlePageBack: () => void;
  handlePageSizeChange: (arg: number) => void;
  forwardDisabled: boolean;
  backDisabled: boolean;
  pageSize: number;
  isDeleting: boolean;
  isSavingEdit: boolean;
  editedDescriptions: Record<string, string>;
  onDeleteRemodel: (remodel: Remodel) => Promise<void>;
  onEditChange: (rowId: string, value: string) => void;
  onEditSave: (remodel: Remodel) => Promise<void>;
  onEditCancel: (rowId: string) => void;
};

const getRemodelRowId = (remodel: Remodel): string => {
  const serial = remodel["from-serial"] ?? "all-serials";
  return `${remodel["from-model"]}:${remodel["to-model"]}:${serial}`;
};

function RemodelTable({
  remodels,
  handlePageForward,
  handlePageBack,
  handlePageSizeChange,
  forwardDisabled,
  backDisabled,
  pageSize,
  isDeleting,
  isSavingEdit,
  editedDescriptions,
  onDeleteRemodel,
  onEditChange,
  onEditSave,
  onEditCancel,
}: Props): React.JSX.Element {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRemodel, setSelectedRemodel] = useState<Remodel | null>(null);
  const isBusy = isDeleting || isSavingEdit;

  const handleDeleteConfirm = async () => {
    if (!selectedRemodel) {
      return;
    }

    try {
      await onDeleteRemodel(selectedRemodel);
      setShowDeleteModal(false);
      setSelectedRemodel(null);
    } catch {
      // Keep modal open so user can retry or cancel.
    }
  };

  const headers = [
    {
      content: "Target model",
      style: { width: "250px" },
      className: "u-truncate",
    },
    {
      content: "Serial",
      className: "u-truncate",
      style: { width: "200px" },
    },
    {
      content: "Created date",
      className: "u-align--right u-truncate",
      style: { width: "130px" },
    },
    { content: "Note", className: "u-truncate" },
    {
      content: "Actions",
      style: { width: "100px" },
      className: "u-align--right",
    },
  ];

  const rows = remodels.map((remodel: Remodel) => {
    const rowId = getRemodelRowId(remodel);
    const currentValue =
      editedDescriptions[rowId] ?? remodel["description"] ?? "";
    const originalValue = remodel["description"] ?? "";
    const isDirty =
      editedDescriptions[rowId] !== undefined &&
      editedDescriptions[rowId] !== originalValue;

    return {
      columns: [
        { content: remodel["to-model"], className: "u-truncate" },
        {
          content: remodel["from-serial"] || "All serial policies",
          className: "u-truncate",
        },
        {
          content: format(new Date(remodel["created-at"]), "dd/MM/yyyy"),
          className: "u-align--right",
        },
        {
          content: (
            <>
              <Input
                type="text"
                value={currentValue}
                onChange={(event) => {
                  onEditChange(rowId, event.target.value);
                }}
                disabled={isBusy}
                className={!isDirty ? "u-no-margin--bottom" : ""}
              />
              {isDirty && (
                <div className="u-align--right">
                  <Button disabled={isBusy} onClick={() => onEditCancel(rowId)}>
                    Revert
                  </Button>
                  <Button
                    appearance="positive"
                    disabled={isBusy}
                    className="u-no-margin--right"
                    onClick={() => {
                      onEditSave(remodel);
                    }}
                  >
                    Save
                    {isSavingEdit && (
                      <>
                        &nbsp;
                        <Icon
                          name="spinner"
                          light
                          className="u-animation--spin"
                        />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          ),
        },
        {
          className: "u-align--right",
          content: (
            <Button
              className="u-no-margin--bottom u-no-margin--right"
              appearance="base"
              disabled={isBusy}
              onClick={() => {
                setSelectedRemodel(remodel);
                setShowDeleteModal(true);
              }}
            >
              <Icon name="delete" />
              <span className="u-off-screen">Delete</span>
            </Button>
          ),
        },
      ],
    };
  });

  return (
    <>
      <MainTable
        data-testid="remodel-table"
        emptyStateMsg="No remodels found"
        headers={headers}
        rows={rows}
        responsive
      />
      <TablePaginationControls
        // Although we don't know the current page as we don't know
        // how many pages there are, the `currentPage` value is required, and
        // must be > 0, to remove the "of more than x rows" in the visible
        // count section. See:
        // https://canonical.github.io/react-components/?path=/story/components-tablepagination--controls-with-partially-known-entries
        currentPage={1}
        itemName="remodel"
        nextButtonProps={{
          disabled: forwardDisabled,
        }}
        onNextPage={handlePageForward}
        onPageSizeChange={handlePageSizeChange}
        onPreviousPage={handlePageBack}
        pageLimits={[10, 25, 50, 100, 500]}
        pageSize={pageSize}
        previousButtonProps={{
          disabled: backDisabled,
        }}
        showPageInput={false}
        visibleCount={rows.length}
        className="table-pagination-controls"
      />
      {showDeleteModal && selectedRemodel && (
        <Modal
          close={() => {
            if (!isBusy) {
              setShowDeleteModal(false);
              setSelectedRemodel(null);
            }
          }}
          title="Delete remodel"
          buttonRow={
            <>
              <Button
                className="u-no-margin--bottom"
                disabled={isBusy}
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedRemodel(null);
                }}
              >
                Cancel
              </Button>
              <Button
                className="u-no-margin--bottom u-no-margin--right"
                appearance="negative"
                disabled={isBusy}
                onClick={() => {
                  void handleDeleteConfirm();
                }}
              >
                {isDeleting ? (
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
          <p>
            Are you sure you want to delete this remodel?
            <br />
            This action cannot be undone.
          </p>
        </Modal>
      )}
    </>
  );
}

export default RemodelTable;
