import { useAtomValue } from "jotai";
import { useParams } from "react-router-dom";
import { MainTable, TablePagination } from "@canonical/react-components";
import { format } from "date-fns";

import { brandStoreState } from "../../state/brandStoreState";
import { serialLogsListState } from "../../state/serialLogsState";

import type { SerialLog } from "../../types/shared";

function SerialLogTable(): React.JSX.Element {
  const { id } = useParams();
  const serialLogs = useAtomValue(serialLogsListState);
  const brandStore = useAtomValue(brandStoreState(id));

  const headers = [
    { content: "Brand" },
    { content: "Model" },
    { content: "Serial" },
    {
      content: "Created date",
      className: "u-align--right",
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
    <TablePagination
      data={rows}
      pageLimits={[25, 50, 100, 200]}
      position="below"
    >
      <MainTable
        data-testid="serial-log-table"
        emptyStateMsg="No serial logs found"
        headers={headers}
      />
    </TablePagination>
  );
}

export default SerialLogTable;
