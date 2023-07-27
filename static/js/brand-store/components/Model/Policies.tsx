import React, { useState, useEffect } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { Row, Col, Notification } from "@canonical/react-components";

import ModelNav from "./ModelNav";
import PoliciesFilter from "./PoliciesFilter";
import PoliciesTable from "./PoliciesTable";
import CreatePolicyForm from "./CreatePolicyForm";

import { usePolicies } from "../../hooks";
import { policiesListFilterState, policiesListState } from "../../atoms";

import { isClosedPanel } from "../../utils";

import type { Policy } from "../../types/shared";

function Policies() {
  const { id, model_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, isError, error, refetch, data }: any = usePolicies(
    id,
    model_id
  );
  const setPoliciesList = useSetRecoilState<Array<Policy>>(policiesListState);
  const setFilter = useSetRecoilState<string>(policiesListFilterState);
  const [searchParams] = useSearchParams();
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [showErrorNotification, setShowErrorNotification] = useState<boolean>(
    false
  );

  useEffect(() => {
    if (!isLoading && !isError) {
      setPoliciesList(data);
      setFilter(searchParams.get("filter") || "");
    } else {
      setPoliciesList([]);
    }
  }, [isLoading, error, data]);

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
                <Link
                  className="p-button"
                  to={`/admin/${id}/models/${model_id}/policies/create`}
                >
                  Create policy
                </Link>
              </Col>
              <Col size={6}>
                <PoliciesFilter />
              </Col>
            </Row>
            <div className="u-fixed-width">
              <>
                {isLoading && <p>Fetching policies...</p>}
                {isError && error && <p>Error: {error.message}</p>}
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
        <CreatePolicyForm
          setShowNotification={setShowNotification}
          setShowErrorNotification={setShowErrorNotification}
          refetchPolicies={refetch}
        />
      </aside>
    </>
  );
}

export default Policies;
