import React, { useState, useEffect } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { Row, Col, Notification, Icon } from "@canonical/react-components";

import { useSigningKeys, useModels } from "../../hooks";
import {
  signingKeysListState,
  signingKeysListFilterState,
  policiesListState,
  newSigningKeyState,
} from "../../atoms";
import { brandStoreState } from "../../selectors";

import SigningKeysFilter from "./SigningKeysFilter";
import SigningKeysTable from "./SigningKeysTable";
import CreateSigningKeyForm from "./CreateSigningKeyForm";
import Navigation from "../Navigation";

import { isClosedPanel, setPageTitle, sortByDateDescending } from "../../utils";

import type { SigningKey, Model, Policy } from "../../types/shared";

function SigningKeys() {
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
    setEnableTableActions(true);
  };

  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, isError, error, data, refetch }: any = useSigningKeys(id);
  const setSigningKeysList =
    useSetRecoilState<Array<SigningKey>>(signingKeysListState);
  const setPolicies = useSetRecoilState<Array<Policy>>(policiesListState);
  const setFilter = useSetRecoilState<string>(signingKeysListFilterState);
  const setNewSigningKey = useSetRecoilState(newSigningKeyState);
  const brandStore = useRecoilValue(brandStoreState(id));
  const [searchParams] = useSearchParams();
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showDisableSuccessNotification, setShowDisableSuccessNotification] =
    useState<boolean>(false);
  const [enableTableActions, setEnableTableActions] = useState(false);

  brandStore
    ? setPageTitle(`Signing keys in ${brandStore.name}`)
    : setPageTitle("Signing keys");

  const models = useModels(id);

  useEffect(() => {
    if (!isLoading && !error) {
      setSigningKeysList(data.sort(sortByDateDescending));
      setFilter(searchParams.get("filter") || "");
    }
  }, [isLoading, error, data]);

  useEffect(() => {
    if (!models.isLoading && !models.isError) {
      getPolicies(models.data);
    }
  }, [models]);

  return (
    <div className="l-application" role="presentation">
      <Navigation sectionName="signing-keys" />
      <main className="l-main">
        <div className="p-panel u-flex-column">
          <div className="p-panel__content u-flex-column u-flex-grow">
            <div className="u-fixed-width">
              <h1 className="p-heading--4">Signing keys</h1>
            </div>
            {showNotification && (
              <div className="u-fixed-width">
                <Notification
                  severity="positive"
                  onDismiss={() => {
                    setShowNotification(false);
                  }}
                >
                  New signing key created
                </Notification>
              </div>
            )}
            {errorMessage && (
              <div className="u-fixed-width">
                <Notification
                  severity="negative"
                  onDismiss={() => {
                    setErrorMessage("");
                  }}
                >
                  {errorMessage}
                </Notification>
              </div>
            )}
            {showDisableSuccessNotification && (
              <div className="u-fixed-width">
                <Notification
                  severity="positive"
                  onDismiss={() => {
                    setShowDisableSuccessNotification(false);
                  }}
                >
                  Signing key successfully deactivated
                </Notification>
              </div>
            )}
            <Row>
              <Col size={6}>
                <SigningKeysFilter />
              </Col>
              <Col size={6} className="u-align--right">
                <Link
                  className="p-button--positive"
                  to={`/admin/${id}/signing-keys/create`}
                >
                  Create new signing key
                </Link>
              </Col>
            </Row>
            <div className="u-fixed-width u-flex-column u-flex-grow">
              {isError && error && (
                <Notification severity="negative">
                  Error: {error.message}
                </Notification>
              )}
              {isLoading ? (
                <p>
                  <Icon name="spinner" className="u-animation--spin" />
                  &nbsp;Fetching signing keys...
                </p>
              ) : (
                <div className="u-flex-column u-flex-grow">
                  <SigningKeysTable
                    setShowDisableSuccessNotification={
                      setShowDisableSuccessNotification
                    }
                    enableTableActions={enableTableActions}
                  />
                </div>
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
          navigate(`/admin/${id}/signing-keys`);
          setNewSigningKey({ name: "" });
          setErrorMessage("");
        }}
      ></div>
      <aside
        className={`l-aside ${
          isClosedPanel(location.pathname, "create") ? "is-collapsed" : ""
        }`}
      >
        <CreateSigningKeyForm
          setShowNotification={setShowNotification}
          setErrorMessage={setErrorMessage}
          refetch={refetch}
        />
      </aside>
    </div>
  );
}

export default SigningKeys;
