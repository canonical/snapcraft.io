import { useAtomValue } from "jotai";
import { MainTable, TablePagination } from "@canonical/react-components";
import { format } from "date-fns";

import { remodelsListState } from "../../state/remodelsState";

import type { Remodel } from "../../types/shared";

function RemodelTable(): React.JSX.Element {
  const remodels = useAtomValue(remodelsListState);

  const headers = [
    {
      content: "Target model",
      style: { width: "250px" },
    },
    {
      content: "Original model",
      style: { width: "250px" },
    },
    { content: "Serial" },
    {
      content: "Created date",
      className: "u-align--right",
      style: { width: "130px" },
    },
    { content: "Note" },
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
    <TablePagination
      data={rows}
      pageLimits={[25, 50, 100, 200]}
      position="below"
    >
      <MainTable
        data-testid="remodel-table"
        emptyStateMsg="No remodels found"
        headers={headers}
      />
    </TablePagination>
  );
}

export default RemodelTable;
