import React, { useState } from "react";
import { useRecoilState } from "recoil";
import {
  Link,
  useParams,
  useSearchParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { format } from "date-fns";
import randomstring from "randomstring";
import {
  MainTable,
  Row,
  Col,
  Button,
  Input,
  Icon,
} from "@canonical/react-components";

import { brandStoresState } from "../../atoms";

import SectionNav from "../SectionNav";

import {
  checkModelNameExists,
  getFilteredModels,
  isClosedPanel,
  maskString,
} from "../../utils";

import type { Model, Store } from "../../types/shared";

// This is temporary until the API is connected
import modelsData from "./models-data";

function Models() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const models = getFilteredModels(modelsData.data, searchParams.get("filter"));

  const [newModelName, setNewModelName] = useState("");
  const [apiKey, setApiKey] = useState("");

  const stores = useRecoilState(brandStoresState);
  const currentStore = stores[0].find((store: Store) => store.id === id);

  return (
    <>
      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__content">
            <div className="u-fixed-width">
              <SectionNav sectionName="models" />
            </div>
            <Row>
              <Col size={6}>
                <Link className="p-button" to={`/admin/${id}/models/create`}>
                  Create new model
                </Link>
              </Col>
              <Col size={6}>
                <div className="p-search-box">
                  <Input
                    type="search"
                    id="search"
                    className="p-search-box__input"
                    label="Search models"
                    labelClassName="u-off-screen"
                    placeholder="Search models"
                    autoComplete="off"
                    value={searchParams.get("filter") || ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSearchParams({ filter: e.target.value });
                      } else {
                        setSearchParams();
                      }
                    }}
                  />
                  <Button
                    type="reset"
                    className="p-search-box__reset"
                    onClick={() => {
                      setSearchParams();
                    }}
                  >
                    <Icon name="close">Close</Icon>
                  </Button>
                  <Button type="submit" className="p-search-box__button">
                    <Icon name="search">Search</Icon>
                  </Button>
                </div>
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
      <div
        className={`l-aside__overlay ${
          isClosedPanel(location.pathname, "create") ? "u-hide" : ""
        }`}
        onClick={() => {
          navigate(`/admin/${id}/models`);
          setNewModelName("");
          setApiKey("");
        }}
      ></div>
      <aside
        className={`l-aside ${
          isClosedPanel(location.pathname, "create") ? "is-collapsed" : ""
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Submit");
          }}
          style={{ height: "100%" }}
        >
          <div className="p-panel is-flex-column">
            <div className="p-panel__header">
              <h4 className="p-panel__title">Create new model</h4>
            </div>
            <div className="p-panel__content">
              <div className="u-fixed-width">
                {currentStore && (
                  <p>
                    Brand
                    <br />
                    {currentStore.name}
                  </p>
                )}
                <Input
                  type="text"
                  id="model-name-field"
                  placeholder="e.g. display-name-123"
                  label="Name"
                  help="Name should contain lowercase alphanumeric characters and hyphens only"
                  value={newModelName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewModelName(value);
                  }}
                  error={
                    checkModelNameExists(newModelName, models)
                      ? `Model ${newModelName} already exists`
                      : null
                  }
                  required
                />
                <Input
                  type="text"
                  id="api-key-field"
                  label="API key"
                  value={apiKey}
                  placeholder="yx6dnxsWQ3XUB5gza8idCuMvwmxtk1xBpa9by8TuMit5dgGnv"
                  className="read-only-dark"
                  style={{ color: "#000" }}
                  readOnly
                />
                <Button
                  type="button"
                  onClick={() => {
                    setApiKey(
                      randomstring.generate({
                        length: 50,
                      })
                    );
                  }}
                >
                  Generate key
                </Button>
              </div>
            </div>
            <div className="u-fixed-width">
              <p>* Mandatory field</p>
            </div>
            <hr />
            <div className="p-panel__footer u-align--right">
              <div className="u-fixed-width">
                <Button
                  className="u-no-margin--bottom"
                  onClick={() => {
                    navigate(`/admin/${id}/models`);
                    setNewModelName("");
                    setApiKey("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  appearance="positive"
                  className="u-no-margin--bottom u-no-margin--right"
                  disabled={
                    !newModelName || checkModelNameExists(newModelName, models)
                  }
                >
                  Add model
                </Button>
              </div>
            </div>
          </div>
        </form>
      </aside>
    </>
  );
}

export default Models;
