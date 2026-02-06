import { useAtomValue } from "jotai";
import { MainTable } from "@canonical/react-components";
import { format } from "date-fns";

import { filteredRemodelsListState } from "../../state/remodelsState";

import type { Remodel } from "../../types/shared";

function RemodelTable(): React.JSX.Element {
  const remodels = useAtomValue(filteredRemodelsListState);

  const headers = [
    { content: "Target model", sortKey: "to-model" },
    { content: "Original model", sortKey: "from-model" },
    { content: "Allowed devices" },
    { content: "Created date", sortKey: "created-at" },
    { content: "Note" },
  ];

  const rows = remodels.map((remodel: Remodel) => {
    return {
      columns: [
        { content: remodel["to-model"] },
        { content: remodel["from-model"] },
        { content: remodel["serials"] },
        { content: format(new Date(remodel["created-at"]), "dd/MM/yyyy") },
        { content: remodel["description"] },
      ],
      sortData: {
        "to-model": remodel["to-model"],
        "from-model": remodel["from-model"],
        "created-at": remodel["created-at"],
      },
    };
  });

  return (
    <MainTable
      data-testid="remodels-table"
      sortable
      emptyStateMsg="No remodels match this filter"
      headers={headers}
      rows={rows}
    />
  );
}

export default RemodelTable;
