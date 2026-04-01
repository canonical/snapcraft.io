import { useAtomValue } from "jotai";
import { useParams } from "react-router-dom";
import { MainTable, TablePagination } from "@canonical/react-components";
import { format } from "date-fns";

import { brandStoreState } from "../../state/brandStoreState";
import { filteredSerialLogsListState } from "../../state/serialLogState";
import { useSortTableData } from "../../hooks";

import type { SerialLog } from "../../types/shared";

function SerialLogTable(): React.JSX.Element {
  const { id } = useParams();
  const serialLogs = useAtomValue(filteredSerialLogsListState);
  const brandStore = useAtomValue(brandStoreState(id));

  const headers = [
    { content: "Brand" },
    { content: "Model" },
    { content: "Serial number" },
    { content: "Date", sortKey: "created-at" },
  ];

  const rows = serialLogs.map((serialLog: SerialLog) => {
    return {
      columns: [
        { content: brandStore?.name },
        { content: serialLog["model-name"] },
        { content: serialLog.serial },
        {
          content: format(
            new Date(serialLog["created-at"]),
            "dd/MM/yyyy 'at' HH:mm",
          ),
        },
      ],
      sortData: {
        "created-at": serialLog["created-at"],
      },
    };
  });

  const { rows: sortedRows, updateSort } = useSortTableData({ rows });

  return (
    <TablePagination
      data={sortedRows}
      pageLimits={[25, 50, 100, 200]}
      position="below"
    >
      <MainTable
        data-testid="serial-log-table"
        sortable
        emptyStateMsg="No serial logs match this filter"
        headers={headers}
        onUpdateSort={updateSort}
      />
    </TablePagination>
  );
}

export default SerialLogTable;
