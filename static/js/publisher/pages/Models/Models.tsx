import { useState, useEffect } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { useAtomValue } from "jotai";
import {
  Link,
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Row, Col, Notification, Icon } from "@canonical/react-components";
import { UseQueryResult } from "react-query";

import {
  modelsListFilterState,
  modelsListState,
  newModelState,
} from "../../state/modelsState";
import { policiesListState } from "../../state/policiesState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";

import Filter from "../../components/Filter";
import ModelsTable from "./ModelsTable";
import CreateModelForm from "./CreateModelForm";
import Navigation from "../../components/Navigation";

import { useModels } from "../../hooks";
import { isClosedPanel, setPageTitle, getPolicies } from "../../utils";

import type { Model as ModelType, Policy } from "../../types/shared";

function Models(): React.JSX.Element {
  const { id } = useParams();
  const brandId = useAtomValue(brandIdState);

  const {
    data: models,
    isLoading: modelsIsLoading,
    error: modelsError,
    isError: modelsIsError,
  }: UseQueryResult<ModelType[]> = useModels(brandId);

  const location = useLocation();
  const navigate = useNavigate();
  const setModelsList = useSetRecoilState<Array<ModelType>>(modelsListState);
  const setPolicies = useSetRecoilState<Array<Policy>>(policiesListState);
  const setNewModel = useSetRecoilState(newModelState);
  const setFilter = useSetRecoilState<string>(modelsListFilterState);
  const brandStore = useRecoilValue(brandStoreState(id));
  const [searchParams] = useSearchParams();
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showErrorNotification, setShowErrorNotification] =
    useState<boolean>(false);

  brandStore
    ? setPageTitle(`Models in ${brandStore.name}`)
    : setPageTitle("Models");

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!modelsIsLoading && !modelsError && models) {
      setModelsList(models);
      setFilter(searchParams.get("filter") || "");
      getPolicies({ models, id, setPolicies, signal });
    }

    return () => {
      controller.abort();
    };
  }, [modelsIsLoading, modelsError, models]);

  return (
    <div className="l-application" role="presentation">
      <Navigation sectionName="models" />
      <main className="l-main">
        <div className="p-panel u-flex-column">
          <div className="p-panel__content u-flex-column u-flex-grow">
            <div className="u-fixed-width">
              <h1 className="p-heading--4">Models</h1>
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
                <Filter
                  state={modelsListFilterState}
                  label="Search models"
                  placeholder="Search models"
                />
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
            <div className="u-fixed-width u-flex-column u-flex-grow">
              <div>
                {modelsIsError && modelsError instanceof Error && (
                  <Notification severity="negative">
                    Error: {modelsError.message}
                  </Notification>
                )}
                {modelsIsLoading ? (
                  <p>
                    <Icon name="spinner" className="u-animation--spin" />
                    &nbsp;Fetching models...
                  </p>
                ) : (
                  <div className="u-flex-column u-flex-grow">
                    <ModelsTable />
                  </div>
                )}
              </div>
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
          setNewModel({ name: "", apiKey: "" });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            navigate(`/admin/${id}/models`);
            setShowErrorNotification(false);
            setNewModel({ name: "", apiKey: "" });
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Navigate to models page"
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
    </div>
  );
}

export default Models;
