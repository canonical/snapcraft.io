import { Link, useParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { format } from "date-fns";
import { MainTable, TablePagination } from "@canonical/react-components";

import { maskString, sortByDateDescending } from "../../utils";

import { filteredModelsListState } from "../../state/modelsState";

import { useSortTableData } from "../../hooks";

import type { Model as ModelType } from "../../types/shared";

function ModelsTable(): React.JSX.Element {
  const { id } = useParams();
  const modelsList = useAtomValue<Array<ModelType>>(filteredModelsListState);

  const headers = [
    {
      content: `Name (${modelsList.length})`,
      sortKey: "name",
    },
    {
      content: "API key",
      className: "u-align--right",
    },
    {
      content: "Policy revision",
      className: "u-align--right",
      style: {
        width: "150px",
      },
    },
    {
      content: "Last updated",
      className: "u-align--right",
      sortKey: "modified-at",
      style: {
        width: "120px",
      },
    },
    {
      content: "Created date",
      className: "u-align--right",
      sortKey: "created-at",
      style: {
        width: "120px",
      },
    },
  ];

  const rows = modelsList.sort(sortByDateDescending).map((model: ModelType) => {
    return {
      columns: [
        {
          content: (
            <Link to={`/admin/${id}/models/${model.name}`}>{model.name}</Link>
          ),
          className: "u-truncate",
        },
        {
          content: maskString(model["api-key"]) || "-",
          className: "u-align--right",
        },
        {
          content:
            model["policy-revision"] !== undefined
              ? model["policy-revision"]
              : "-",
          className: "u-align--right",
        },
        {
          content:
            model["modified-at"] && model["modified-at"] !== null
              ? format(new Date(model["modified-at"]), "dd/MM/yyyy")
              : "-",
          className: "u-align--right",
        },
        {
          content:
            model["created-at"] !== null
              ? format(new Date(model["created-at"]), "dd/MM/yyyy")
              : "-",
          className: "u-align--right",
        },
      ],
      sortData: {
        name: model.name,
        "modified-at": model["modified-at"],
        "created-at": model["created-at"],
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
        data-testid="models-table"
        sortable
        onUpdateSort={updateSort}
        emptyStateMsg="No models match this filter"
        headers={headers}
      />
    </TablePagination>
  );
}

export default ModelsTable;
