import React from "react";
import { Link, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { format } from "date-fns";
import { MainTable } from "@canonical/react-components";

import { maskString } from "../../utils";

import { filteredModelsListState } from "../../selectors";

import type { Model } from "../../types/shared";

function ModelsTable() {
  const { id } = useParams();
  const modelsList = useRecoilValue<Array<Model>>(filteredModelsListState);

  return (
    <MainTable
      data-testid="models-table"
      sortable
      paginate={20}
      emptyStateMsg="No models match this filter"
      headers={[
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
        },
        {
          content: "Last updated",
          className: "u-align--right",
          sortKey: "modified-at",
        },
        {
          content: "Created date",
          className: "u-align--right",
          sortKey: "created-at",
        },
      ]}
      rows={modelsList.map((model: Model) => {
        return {
          columns: [
            {
              content: (
                <Link to={`/admin/${id}/models/${model.name}`}>
                  {model.name}
                </Link>
              ),
            },
            {
              content: maskString(model["api-key"]),
              className: "u-align--right",
            },
            {
              content: model["policy-revision"] || "-",
              className: "u-align--right",
            },
            {
              content:
                model["modified-at"] !== null
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
      })}
    />
  );
}

export default ModelsTable;
