import React, { useState, useEffect } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import {
  Link,
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Row, Col, Notification, Icon } from "@canonical/react-components";

import { useModels } from "../../hooks";
import {
  modelsListFilterState,
  modelsListState,
  policiesListState,
} from "../../atoms";
import { brandStoreState } from "../../selectors";

import SectionNav from "../SectionNav";
import ModelsFilter from "./ModelsFilter";
import ModelsTable from "./ModelsTable";
import CreateModelForm from "./CreateModelForm";

import { isClosedPanel, setPageTitle } from "../../utils";

import type { Model, Policy } from "../../types/shared";

function Models() {
  const getPolicies = async (modelsList: Array<Model>) => {
    const data = await Promise.all(
      modelsList.map((model) => {
        return fetch(`/admin/store/${id}/models/${model.name}/policies`);
      })
    );

    const allPolicies = await Promise.all(
      data.map(async (res) => {
        if (!res.ok) {
          return [];
        }

        const policies = await res.json();

        if (!policies.success) {
          return [];
        }

        return policies.data;
      })
    );

    setPolicies(allPolicies.flat());
  };

  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, isError, error, data }: any = useModels(id);
  const setModelsList = useSetRecoilState<Array<Model>>(modelsListState);
  const setPolicies = useSetRecoilState<Array<Policy>>(policiesListState);
  const setFilter = useSetRecoilState<string>(modelsListFilterState);
  const brandStore = useRecoilValue(brandStoreState(id));
  const [searchParams] = useSearchParams();
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showErrorNotification, setShowErrorNotification] = useState<boolean>(
    false
  );

  brandStore
    ? setPageTitle(`Models in ${brandStore.name}`)
    : setPageTitle("Models");

  useEffect(() => {
    if (!isLoading && !error) {
      setModelsList(data);
      setFilter(searchParams.get("filter") || "");
      getPolicies(data);
    }
  }, [isLoading, error, data]);

  return (
    <>
      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__content">
            <div className="u-fixed-width">
              <SectionNav sectionName="models" />
            </div>
            {showNotification && (
              <div className="u-fixed-width">
                <Notification
                  severity="positive"
                  onDismiss={() => {
                    setShowNotification(false);
                  }}
                >
                  New model created
                </Notification>
              </div>
            )}
            {showErrorNotification && (
              <div className="u-fixed-width">
                <Notification
                  severity="negative"
                  onDismiss={() => {
                    setShowErrorNotification(false);
                  }}
                >
                  Unable to create model
                </Notification>
              </div>
            )}
            <Row>
              <Col size={6}>
                <ModelsFilter />
              </Col>
              <Col size={6} className="u-align--right">
                <Link
                  className="p-button--positive"
                  to={`/admin/${id}/models/create`}
                >
                  Create new model
                </Link>
              </Col>
            </Row>
            <div className="u-fixed-width">
              <>
                {isError && error && (
                  <Notification severity="negative">
                    Error: {error.message}
                  </Notification>
                )}
                {isLoading ? (
                  <p>
                    <Icon name="spinner" className="u-animation--spin" />
                    &nbsp;Fetching models...
                  </p>
                ) : (
                  <ModelsTable />
                )}
              </>
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
          setShowErrorNotification(false);
        }}
      ></div>
      <aside
        className={`l-aside ${
          isClosedPanel(location.pathname, "create") ? "is-collapsed" : ""
        }`}
      >
        <CreateModelForm
          setShowNotification={setShowNotification}
          setShowErrorNotification={setShowErrorNotification}
        />
      </aside>
    </>
  );
}

export default Models;
