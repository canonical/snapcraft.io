import { useState, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { Row, Col, Notification, Icon } from "@canonical/react-components";
import { UseQueryResult } from "react-query";

import { useSigningKeys, useModels } from "../../hooks";
import {
  signingKeysListState,
  signingKeysListFilterState,
  newSigningKeyState,
} from "../../state/signingKeysState";
import { policiesListState } from "../../state/policiesState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";

import Filter from "../../components/Filter";
import SigningKeysTable from "./SigningKeysTable";
import CreateSigningKeyForm from "./CreateSigningKeyForm";
import Navigation from "../../components/Navigation";

import {
  isClosedPanel,
  setPageTitle,
  sortByDateDescending,
  getPolicies,
} from "../../utils";

import type { SigningKey, Model } from "../../types/shared";

function SigningKeys(): React.JSX.Element {
  const { id } = useParams();
  const brandId = useAtomValue(brandIdState);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    isLoading,
    isError,
    error,
    data,
    refetch,
  }: UseQueryResult<SigningKey[], Error> = useSigningKeys(id);
  const setSigningKeysList = useSetAtom(signingKeysListState);
  const setPolicies = useSetAtom(policiesListState);
  const setFilter = useSetAtom(signingKeysListFilterState);
  const setNewSigningKey = useSetAtom(newSigningKeyState);
  const brandStore = useAtomValue(brandStoreState(id));
  const [searchParams] = useSearchParams();
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showDisableSuccessNotification, setShowDisableSuccessNotification] =
    useState<boolean>(false);
  const [enableTableActions, setEnableTableActions] = useState(false);

  brandStore
    ? setPageTitle(`Signing keys in ${brandStore.name}`)
    : setPageTitle("Signing keys");

  const {
    data: models,
    isLoading: modelsIsLoading,
    isError: modelsIsError,
  }: UseQueryResult<Model[], Error> = useModels(brandId);

  useEffect(() => {
    if (!isLoading && !error && data) {
      const newData = [...data];
      setSigningKeysList(newData.sort(sortByDateDescending));
      setFilter(searchParams.get("filter") || "");
    }
  }, [isLoading, error, data, brandId, id]);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!modelsIsLoading && !modelsIsError && models) {
      getPolicies({
        models,
        id,
        setPolicies,
        signal,
        setEnableTableActions,
      });
    }

    return () => {
      controller.abort();
    };
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
                <Filter
                  state={signingKeysListFilterState}
                  label="Signing keys"
                  placeholder="Search keys"
                />
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
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            navigate(`/admin/${id}/signing-keys`);
            setNewSigningKey({ name: "" });
            setErrorMessage("");
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Navigate to signing keys"
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
