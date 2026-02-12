import { useAtomValue } from "jotai";
import { MainTable, TablePagination } from "@canonical/react-components";
import { format } from "date-fns";

import { filteredRemodelsListState } from "../../state/remodelsState";
import { useSortTableData } from "../../hooks";

import type { Remodel } from "../../types/shared";

function RemodelTable(): React.JSX.Element {
  const remodels = useAtomValue(filteredRemodelsListState);

  const headers = [
    { content: "Target model", sortKey: "to-model", style: { width: "250px" } },
    {
      content: "Original model",
      sortKey: "from-model",
      style: { width: "250px" },
    },
    {
      content: "Allowed devices",
      className: "u-align--right",
      style: { width: "150px" },
    },
    {
      content: "Created date",
      className: "u-align--right",
      sortKey: "created-at",
      style: { width: "120px" },
    },
    { content: "Note" },
  ];

  const rows = remodels.map((remodel: Remodel) => {
    return {
      columns: [
        { content: remodel["to-model"] },
        { content: remodel["from-model"] },
        { content: remodel["serials"], className: "u-align--right" },
        {
          content: format(new Date(remodel["created-at"]), "dd/MM/yyyy"),
          className: "u-align--right",
        },
        { content: remodel["description"] },
      ],
      sortData: {
        "to-model": remodel["to-model"],
        "from-model": remodel["from-model"],
        "created-at": remodel["created-at"],
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
        data-testid="remodel-table"
        sortable
        emptyStateMsg="No remodels match this filter"
        headers={headers}
        rows={rows}
        onUpdateSort={updateSort}
      />
    </TablePagination>
  );
}

export default RemodelTable;
