import React from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { format } from "date-fns";
import {
  MainTable,
  Row,
  Col,
  Button,
  Input,
  Icon,
} from "@canonical/react-components";

import ModelNav from "./ModelNav";

import { getFilteredPolicies, isClosedPanel } from "../../utils";

import type { Policy } from "../../types/shared";

// This is temporary until the API is connected
import policiesData from "./policies-data";

function Policies() {
  const { id, model_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const policies = getFilteredPolicies(
    policiesData.data,
    searchParams.get("filter")
  );

  return (
    <>
      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__content">
            <div className="u-fixed-width">
              <Link to={`/admin/${id}/models`}>&lsaquo;&nbsp;Models</Link>
            </div>
            <div className="u-fixed-width">
              <h1>{model_id}</h1>
            </div>
            <div className="u-fixed-width">
              <ModelNav sectionName="policies" />
            </div>
            <Row>
              <Col size={6}>
                <Link
                  className="p-button"
                  to={`/admin/${id}/models/${model_id}/policies/create`}
                >
                  Create policy
                </Link>
              </Col>
              <Col size={6}>
                <div className="p-search-box">
                  <Input
                    type="search"
                    id="search"
                    className="p-search-box__input"
                    label="Search policies"
                    labelClassName="u-off-screen"
                    placeholder="Search policies"
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
              {policies.length > 0 && (
                <MainTable
                  data-testid="policies-table"
                  sortable
                  paginate={10}
                  emptyStateMsg="Fetching policies data..."
                  headers={[
                    {
                      content: "Revision",
                      sortKey: "revision",
                    },
                    {
                      content: "Signing key",
                    },
                    {
                      content: "Creation date",
                      sortKey: "created-at",
                    },
                  ]}
                  rows={policies.map((policy: Policy) => {
                    return {
                      columns: [
                        {
                          content: policy.revision,
                        },
                        {
                          content: policy["signing-key-sha3-384"],
                        },
                        {
                          content: format(
                            new Date(policy["created-at"]),
                            "dd/MM/yyyy"
                          ),
                        },
                      ],
                      sortData: {
                        revision: policy.revision,
                        "created-at": policy["created-at"],
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
          navigate(`/admin/${id}/models/${model_id}/policies`);
        }}
      ></div>
      <aside
        className={`l-aside ${
          isClosedPanel(location.pathname, "create") ? "is-collapsed" : ""
        }`}
      >
        <div className="p-panel is-flex-column">
          <div className="p-panel__header">
            <h4 className="p-panel__title">Create new policy</h4>
          </div>
          <div className="p-panel__content">
            <div className="u-fixed-width">
              <div>
                <label htmlFor="signing-key">Signing key</label>
                <select name="signing-key" id="signing-key" required disabled>
                  <option value="">Select a signing key</option>
                </select>
                <p className="p-form-help-text">
                  No signing keys available, please{" "}
                  <Link to={`/admin/${id}/models/signing-keys/create`}>
                    create one
                  </Link>{" "}
                  first.
                </p>
              </div>
            </div>
          </div>
          <hr />
          <div className="p-panel__footer u-align--right">
            <div className="u-fixed-width">
              <Button
                className="u-no-margin--bottom"
                onClick={() => {
                  navigate(`/admin/${id}/models/${model_id}/policies`);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                appearance="positive"
                className="u-no-margin--bottom u-no-margin--right"
                disabled
              >
                Add policy
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Policies;
