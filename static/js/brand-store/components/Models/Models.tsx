import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { MainTable, SearchBox, Row, Col } from "@canonical/react-components";

import SectionNav from "../SectionNav";

import { getFilteredModels, maskString } from "../../utils";

import type { Model } from "../../types/shared";

// This is temporary until the API is connected
import modelsData from "./models-data";

function Models() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const models = getFilteredModels(modelsData.data, searchParams.get("filter"));

  return (
    <main className="l-main">
      <div className="p-panel">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <SectionNav sectionName="models" />
          </div>
          <Row>
            <Col size={6}>
              {/* Placeholder for "Create new model" button */}
            </Col>
            <Col size={6}>
              <SearchBox
                placeholder="Search models"
                autoComplete="off"
                value={searchParams.get("filter") || ""}
                onChange={(value) => {
                  if (value) {
                    setSearchParams({
                      filter: value,
                    });
                  } else {
                    setSearchParams();
                  }
                }}
              />
            </Col>
          </Row>
          <div className="u-fixed-width">
            {models.length > 0 && (
              <MainTable
                data-testid="models-table"
                sortable
                paginate={10}
                emptyStateMsg="Fetching models data..."
                headers={[
                  {
                    content: `Name (${models.length})`,
                    sortKey: "name",
                  },
                  {
                    content: "API key",
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
                rows={models.map((model: Model) => {
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
                        content: format(
                          new Date(model["modified-at"]),
                          "dd/MM/yyyy"
                        ),
                        className: "u-align--right",
                      },
                      {
                        content: format(
                          new Date(model["created-at"]),
                          "dd/MM/yyyy"
                        ),
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
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Models;
