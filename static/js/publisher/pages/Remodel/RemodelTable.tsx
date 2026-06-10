import { useState } from "react";
import {
  Button,
  Icon,
  MainTable,
  Modal,
  TablePaginationControls,
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
  onDeleteRemodel: (remodel: Remodel) => Promise<void>;
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
  onDeleteRemodel,
}: Props): React.JSX.Element {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRemodel, setSelectedRemodel] = useState<Remodel | null>(null);

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
      content: "Original model",
      style: { width: "250px" },
      className: "u-truncate",
    },
    { content: "Serial", className: "u-truncate" },
    {
      content: "Created date",
      className: "u-align--right u-truncate",
      style: { width: "130px" },
    },
    { content: "Note", className: "u-truncate" },
    { content: "Actions", className: "u-align--right" },
  ];

  const rows = remodels.map((remodel: Remodel) => {
    return {
      columns: [
        { content: remodel["to-model"], className: "u-truncate" },
        { content: remodel["from-model"], className: "u-truncate" },
        {
          content: remodel["from-serial"] || "All serial policies",
          className: "u-truncate",
        },
        {
          content: format(new Date(remodel["created-at"]), "dd/MM/yyyy"),
          className: "u-align--right",
        },
        { content: remodel["description"] },
        {
          content: (
            <Button
              className="u-no-margin--bottom u-no-margin--right"
              dense
              disabled={isDeleting}
              onClick={() => {
                setSelectedRemodel(remodel);
                setShowDeleteModal(true);
              }}
            >
              Delete
            </Button>
          ),
          className: "u-align--right",
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
            if (!isDeleting) {
              setShowDeleteModal(false);
              setSelectedRemodel(null);
            }
          }}
          title="Delete remodel"
          buttonRow={
            <>
              <Button
                className="u-no-margin--bottom"
                disabled={isDeleting}
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
                disabled={isDeleting}
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
