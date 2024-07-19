import { ReactElement, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { format } from "date-fns";
import { MainTable } from "@canonical/react-components";

import AppPagination from "../AppPagination";

import { maskString } from "../../utils";

import { filteredModelsListState } from "../../selectors";

import type { Model } from "../../types/shared";

function ModelsTable(): ReactElement {
  const { id } = useParams();
  const modelsList = useRecoilValue<Array<Model>>(filteredModelsListState);
  const [itemsToShow, setItemsToShow] = useState<Array<Model>>(modelsList);

  return (
    <>
      <div className="u-flex-grow">
        <MainTable
          data-testid="models-table"
          sortable
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
          ]}
          rows={itemsToShow.map((model: Model) => {
            return {
              columns: [
                {
                  content: (
                    <Link to={`/admin/${id}/models/${model.name}`}>
                      {model.name}
                    </Link>
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
          })}
        />
      </div>
      <AppPagination
        keyword="model"
        items={modelsList}
        setItemsToShow={setItemsToShow}
      />
    </>
  );
}

export default ModelsTable;
