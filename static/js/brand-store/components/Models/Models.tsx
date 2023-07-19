import React, { useState } from "react";
import { useQuery } from "react-query";
import { useSetRecoilState, useRecoilState } from "recoil";
import {
  Link,
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Row, Col, Notification } from "@canonical/react-components";

import {
  modelsListFilterState,
  modelsListState,
  policiesState,
} from "../../atoms";

import SectionNav from "../SectionNav";
import ModelsFilter from "./ModelsFilter";
import ModelsTable from "./ModelsTable";
import CreateModelForm from "./CreateModelForm";

import { isClosedPanel } from "../../utils";

import type { Model, Policy } from "../../types/shared";

type Query = {
  isLoading: boolean;
  isError: boolean;
  error: {
    message: string;
  } | null;
};

function Models() {
  const getModels = async () => {
    const response = await fetch(`/admin/store/${id}/models`);

    if (!response.ok) {
      throw new Error("There was a problem fetching models");
    }

    const modelsData = await response.json();

    if (!modelsData.success) {
      throw new Error(modelsData.message);
    }

    setModelsList(modelsData.data);
    setFilter(searchParams.get("filter") || "");

    modelsData.data.forEach((model: Model) => {
      getPolicy(model.name);
    });
  };

  const getPolicy = async (modelName: string) => {
    const response = await fetch(
      `/admin/store/${id}/models/${modelName}/policies`
    );

    if (!response.ok) {
      throw new Error("There was a problem fetching the policy");
    }

    const policyData = await response.json();

    if (!policyData.success) {
      throw new Error(policyData.message);
    }

    setPolicies([...policies, policyData.data]);
  };

  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, isError, error }: Query = useQuery("models", getModels);
  const setModelsList = useSetRecoilState<Array<Model>>(modelsListState);
  const [policies, setPolicies] = useRecoilState<Array<Policy>>(policiesState);
  const setFilter = useSetRecoilState<string>(modelsListFilterState);
  const [searchParams] = useSearchParams();
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showErrorNotification, setShowErrorNotification] = useState<boolean>(
    false
  );

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
                <Link className="p-button" to={`/admin/${id}/models/create`}>
                  Create new model
                </Link>
              </Col>
              <Col size={6}>
                <ModelsFilter />
              </Col>
            </Row>
            <div className="u-fixed-width">
              {isLoading && <p>Fetching models...</p>}
              {isError && error && <p>Error: {error.message}</p>}
              <ModelsTable />
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
