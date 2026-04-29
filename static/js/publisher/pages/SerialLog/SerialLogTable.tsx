import { useAtomValue } from "jotai";
import { useParams } from "react-router-dom";
import {
  MainTable,
  TablePaginationControls,
} from "@canonical/react-components";
import { format } from "date-fns";

import { brandStoreState } from "../../state/brandStoreState";
import { serialLogsListState } from "../../state/serialLogsState";

import type { SerialLog } from "../../types/shared";

type Props = {
  handlePageForward: () => void;
  handlePageBack: () => void;
  handlePageSizeChange: (arg: number) => void;
  forwardDisabled: boolean;
  backDisabled: boolean;
  pageSize: number;
};

function SerialLogTable({
  handlePageForward,
  handlePageBack,
  handlePageSizeChange,
  forwardDisabled,
  backDisabled,
  pageSize,
}: Props): React.JSX.Element {
  const { id } = useParams();
  const serialLogs = useAtomValue(serialLogsListState);
  const brandStore = useAtomValue(brandStoreState(id));

  const headers = [
    { content: "Brand", className: "u-truncate" },
    { content: "Model", className: "u-truncate" },
    { content: "Serial", className: "u-truncate" },
    {
      content: "Created date",
      className: "u-align--right u-truncate",
    },
  ];

  const rows = serialLogs.map((serialLog: SerialLog) => {
    return {
      columns: [
        { content: brandStore?.name },
        { content: serialLog["model-name"] },
        { content: serialLog.serial },
        {
          content: format(new Date(serialLog["created-at"]), "dd/MM/yyyy"),
          className: "u-align--right",
        },
      ],
    };
  });

  return (
    <>
      <MainTable
        data-testid="serial-log-table"
        emptyStateMsg="No serial logs found"
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
        itemName="serial log"
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

export default SerialLogTable;
