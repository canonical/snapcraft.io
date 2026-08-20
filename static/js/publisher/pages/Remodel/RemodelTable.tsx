import { useState, useEffect } from "react";
import {
  Button,
  Icon,
  MainTable,
  TablePaginationControls,
  Input,
  CheckboxInput,
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
  isSavingEdit: boolean;
  editedDescriptions: Record<string, string>;
  onEditChange: (rowId: string, value: string) => void;
  onEditSave: (remodel: Remodel) => Promise<void>;
  onEditCancel: (rowId: string) => void;
  remodelsToDelete: Remodel[];
  setRemodelsToDelete: (remodels: Remodel[]) => void;
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
  isSavingEdit,
  editedDescriptions,
  onEditChange,
  onEditSave,
  onEditCancel,
  remodelsToDelete,
  setRemodelsToDelete,
}: Props): React.JSX.Element {
  const [isChecked, setIsChecked] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const isBusy = isSavingEdit;

  useEffect(() => {
    if (remodelsToDelete.length) {
      if (remodelsToDelete.length === remodels.length) {
        setIsChecked(true);
        setIsIndeterminate(false);
      } else {
        setIsChecked(false);
        setIsIndeterminate(true);
      }
    } else {
      setIsChecked(false);
      setIsIndeterminate(false);
    }
  }, [remodelsToDelete, remodels.length]);

  const withCheckboxStyles = {
    paddingBottom: 0,
    width: "2rem",
  };

  const headers = [
    {
      style: withCheckboxStyles,
      content: (
        <div
          style={{
            position: "relative",
            top: "-9px",
          }}
        >
          <CheckboxInput
            labelClassName="u-no-margin--bottom"
            onChange={(e) => {
              if (e.target.checked) {
                setRemodelsToDelete(remodels);
                setIsChecked(true);
              } else {
                setRemodelsToDelete([]);
                setIsChecked(false);
              }
            }}
            checked={isChecked}
            indeterminate={isIndeterminate}
            label=<span className="table-cell-checkbox__label">Name</span>
          />
        </div>
      ),
    },
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
  ];

  const rows = remodels.map((remodel: Remodel) => {
    const rowId = getRemodelRowId(remodel);
    const currentValue =
      editedDescriptions[rowId] ?? remodel["description"] ?? "";
    const originalValue = remodel["description"] ?? "";
    const isDirty =
      editedDescriptions[rowId] !== undefined &&
      editedDescriptions[rowId] !== originalValue;
    const isRowChecked = remodelsToDelete.some(
      (item) => getRemodelRowId(item) === rowId,
    );

    return {
      columns: [
        {
          content: (
            <CheckboxInput
              labelClassName="u-no-margin--bottom u-no-padding--top"
              onChange={(e) => {
                if (e.target.checked) {
                  setRemodelsToDelete([...remodelsToDelete, remodel]);
                } else {
                  setRemodelsToDelete(
                    remodelsToDelete.filter(
                      (item) => getRemodelRowId(item) !== rowId,
                    ),
                  );
                }
              }}
              checked={isRowChecked}
              label=<span className="table-cell-checkbox__label">
                {remodel["to-model"]}
              </span>
            />
          ),
        },
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
    </>
  );
}

export default RemodelTable;
