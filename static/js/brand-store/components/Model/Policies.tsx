import React, { useState, useEffect } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { Row, Col, Notification } from "@canonical/react-components";

import ModelNav from "./ModelNav";
import PoliciesFilter from "./PoliciesFilter";
import PoliciesTable from "./PoliciesTable";
import CreatePolicyForm from "./CreatePolicyForm";

import { usePolicies, useSigningKeys } from "../../hooks";
import {
  policiesListFilterState,
  policiesListState,
  signingKeysListState,
} from "../../atoms";
import { brandStoreState } from "../../selectors";

import { isClosedPanel, setPageTitle } from "../../utils";

import type { Policy, SigningKey } from "../../types/shared";

function Policies() {
  const { id, model_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, isError, error, refetch, data }: any = usePolicies(
    id,
    model_id
  );
  const signingKeys = useSigningKeys(id);
  const setPoliciesList = useSetRecoilState<Array<Policy>>(policiesListState);
  const setFilter = useSetRecoilState<string>(policiesListFilterState);
  const brandStore = useRecoilValue(brandStoreState(id));
  const [searchParams] = useSearchParams();
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showErrorNotification, setShowErrorNotification] = useState<boolean>(
    false
  );
  const setSigningKeysList = useSetRecoilState<Array<SigningKey>>(
    signingKeysListState
  );

  useEffect(() => {
    if (!signingKeys.isLoading && !signingKeys.isError) {
      setSigningKeysList(signingKeys.data);
    }
  }, [signingKeys]);

  useEffect(() => {
    if (!isLoading && !isError) {
      setPoliciesList(data);
      setFilter(searchParams.get("filter") || "");
    } else {
      setPoliciesList([]);
    }
  }, [isLoading, error, data]);

  brandStore
    ? setPageTitle(`Policies in ${brandStore.name}`)
    : setPageTitle("Policies");

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
            {showNotification && (
              <div className="u-fixed-width">
                <Notification
                  severity="positive"
                  onDismiss={() => {
                    setShowNotification(false);
                  }}
                >
                  New policy created
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
                  Unable to create policy
                </Notification>
              </div>
            )}
            <Row>
              <Col size={6}>
                <PoliciesFilter />
              </Col>
              <Col size={6} className="u-align--right">
                <Link
                  className="p-button"
                  to={`/admin/${id}/models/${model_id}/policies/create`}
                >
                  Create policy
                </Link>
              </Col>
            </Row>
            <div className="u-fixed-width">
              <>
                {isLoading && <p>Fetching policies...</p>}
                {isError && error && (
                  <Notification severity="negative">
                    Error: {error.message}
                  </Notification>
                )}
                <PoliciesTable />
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
          navigate(`/admin/${id}/models/${model_id}/policies`);
        }}
      ></div>
      <aside
        className={`l-aside ${
          isClosedPanel(location.pathname, "create") ? "is-collapsed" : ""
        }`}
      >
        {!isClosedPanel(location.pathname, "create") && (
          <CreatePolicyForm
            setShowNotification={setShowNotification}
            setShowErrorNotification={setShowErrorNotification}
            refetchPolicies={refetch}
          />
        )}
      </aside>
    </>
  );
}

export default Policies;
