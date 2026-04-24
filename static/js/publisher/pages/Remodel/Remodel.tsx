import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Notification, Icon, Row, Col } from "@canonical/react-components";

import { useRemodels } from "../../hooks";
import { remodelsListState } from "../../state/remodelsState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";
import { setPageTitle, isClosedPanel } from "../../utils";
import { PortalEntrance } from "../Portals/Portals";

import RemodelTable from "./RemodelTable";
import ConfigureRemodelForm from "./ConfigureRemodelForm";

import type { UseQueryResult } from "react-query";
import type { Remodel, RemodelResponse, ApiResponse } from "../../types/shared";

function Remodel(): React.JSX.Element {
  const { id, modelId } = useParams();
  const location = useLocation();
  const brandId = useAtomValue(brandIdState);
  const {
    isLoading,
    isError,
    error,
    data,
    refetch,
  }: UseQueryResult<ApiResponse<RemodelResponse>, Error> = useRemodels(
    brandId,
    modelId,
  );
  const setRemodels = useSetAtom(remodelsListState);
  const [showNotification, setShowNotification] = useState(false);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const brandStore = useAtomValue(brandStoreState(id));
  const navigate = useNavigate();

  brandStore
    ? setPageTitle(`Remodels in ${brandStore.name}`)
    : setPageTitle("Remodels");

  useEffect(() => {
    if (!isLoading && !isError && data) {
      setRemodels(data.data?.allowlist || []);
    }
  }, [isLoading, isError, data, brandId, id]);

  return (
    <>
      <div className="u-fixed-width u-flex-column u-flex-grow">
        {isError && error && (
          <Notification severity="negative">
            Error: {error.message}
          </Notification>
        )}
        {isLoading ? (
          <p>
            <Icon name="spinner" className="u-animation--spin" />
            &nbsp;Fetching remodels...
          </p>
        ) : data && data.success === false ? (
          <Notification severity="caution">
            {data.message || "Unable to fetch remodels"}
          </Notification>
        ) : (
          <>
            <Row>
              <Col size={12} className="u-align--right">
                <Link
                  className={`p-button--positive ${isError && !data ? "is-disabled" : ""}`}
                  to={`/admin/${id}/models/${modelId}/remodel/configure`}
                >
                  Configure remodels
                </Link>
              </Col>
            </Row>
            <div className="u-flex-column u-flex-grow">
              <RemodelTable />
            </div>
          </>
        )}
      </div>

      <PortalEntrance name="notification">
        {showNotification && (
          <div className="u-fixed-width">
            <Notification
              severity="positive"
              onDismiss={() => {
                setShowNotification(false);
              }}
            >
              New remodel configured
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
              {errorMessage || "Unable to configure remodel"}
            </Notification>
          </div>
        )}
      </PortalEntrance>

      <PortalEntrance name="aside">
        <div
          className={`l-aside__overlay ${
            isClosedPanel(location.pathname, "configure") ? "u-hide" : ""
          }`}
          onClick={() => {
            navigate(`/admin/${id}/models/${modelId}/remodel`);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate(`/admin/${id}/models/${modelId}/remodel`);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Return to remodels"
        ></div>
        <aside
          className={`l-aside ${
            isClosedPanel(location.pathname, "configure") ? "is-collapsed" : ""
          }`}
        >
          <ConfigureRemodelForm
            refetch={refetch}
            setShowNotification={setShowNotification}
            setShowErrorNotification={setShowErrorNotification}
            setErrorMessage={setErrorMessage}
          />
        </aside>
      </PortalEntrance>
    </>
  );
}

export default Remodel;
