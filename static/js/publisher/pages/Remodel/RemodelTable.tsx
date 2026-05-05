import { useAtomValue } from "jotai";
import {
  MainTable,
  TablePaginationControls,
} from "@canonical/react-components";
import { format } from "date-fns";

import { remodelsListState } from "../../state/remodelsState";

import type { Remodel } from "../../types/shared";

type Props = {
  handlePageForward: () => void;
  handlePageBack: () => void;
  handlePageSizeChange: (arg: number) => void;
  forwardDisabled: boolean;
  backDisabled: boolean;
  pageSize: number;
};

function RemodelTable({
  handlePageForward,
  handlePageBack,
  handlePageSizeChange,
  forwardDisabled,
  backDisabled,
  pageSize,
}: Props): React.JSX.Element {
  const remodels = useAtomValue(remodelsListState);

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
