import React, { useState, useEffect } from "react";
import { useSetRecoilState, useRecoilValue } from "recoil";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { Row, Col, Notification } from "@canonical/react-components";

import { sortByDateDescending } from "../../utils";

import { useSigningKeys, useModels } from "../../hooks";

import {
  signingKeysListState,
  signingKeysListFilterState,
  policiesListState,
} from "../../atoms";
import { brandStoreState } from "../../selectors";

import SectionNav from "../SectionNav";
import SigningKeysFilter from "./SigningKeysFilter";
import SigningKeysTable from "./SigningKeysTable";
import CreateSigningKeyForm from "./CreateSigningKeyForm";

import { isClosedPanel, setPageTitle } from "../../utils";

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
  };

  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, isError, error, data, refetch }: any = useSigningKeys(id);
  const setSigningKeysList = useSetRecoilState<Array<SigningKey>>(
    signingKeysListState
  );
  const setPolicies = useSetRecoilState<Array<Policy>>(policiesListState);
  const setFilter = useSetRecoilState<string>(signingKeysListFilterState);
  const brandStore = useRecoilValue(brandStoreState(id));
  const [searchParams] = useSearchParams();
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showErrorNotification, setShowErrorNotification] = useState<boolean>(
    false
  );
  const [
    showDisableSuccessNotification,
    setShowDisableSuccessNotification,
  ] = useState<boolean>(false);

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
    <>
      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__content">
            <div className="u-fixed-width">
              <SectionNav sectionName="signing-keys" />
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
            {showErrorNotification && (
              <div className="u-fixed-width">
                <Notification
                  severity="negative"
                  onDismiss={() => {
                    setShowErrorNotification(false);
                  }}
                >
                  Unable to create signing key
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
                <Link
                  className="p-button"
                  to={`/admin/${id}/signing-keys/create`}
                >
                  Create new signing key
                </Link>
              </Col>
              <Col size={6}>
                <SigningKeysFilter />
              </Col>
            </Row>
            <div className="u-fixed-width">
              {isLoading && <p>Fetching signing keys...</p>}
              {isError && error && (
                <Notification severity="negative">
                  Error: {error.message}
                </Notification>
              )}
              <SigningKeysTable
                setShowDisableSuccessNotification={
                  setShowDisableSuccessNotification
                }
              />
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
          setShowErrorNotification(false);
        }}
      ></div>
      <aside
        className={`l-aside ${
          isClosedPanel(location.pathname, "create") ? "is-collapsed" : ""
        }`}
      >
        {!isClosedPanel(location.pathname, "create") && (
          <CreateSigningKeyForm
            setShowNotification={setShowNotification}
            setShowErrorNotification={setShowErrorNotification}
            refetch={refetch}
          />
        )}
      </aside>
    </>
  );
}

export default SigningKeys;
