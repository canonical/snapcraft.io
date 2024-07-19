import { useState, useEffect, ReactElement } from "react";
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
  newModelState,
} from "../../atoms";
import { brandStoreState } from "../../selectors";

import Filter from "../Filter";
import ModelsTable from "./ModelsTable";
import CreateModelForm from "./CreateModelForm";
import Navigation from "../Navigation";

import { isClosedPanel, setPageTitle, getPolicies } from "../../utils";

import type { Model, Policy } from "../../types/shared";

function Models(): ReactElement {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, isError, error, data }: any = useModels(id);
  const setModelsList = useSetRecoilState<Array<Model>>(modelsListState);
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
    if (!isLoading && !error) {
      setModelsList(data);
      setFilter(searchParams.get("filter") || "");
      getPolicies(data, id, setPolicies);
    }
  }, [isLoading, error, data]);

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
