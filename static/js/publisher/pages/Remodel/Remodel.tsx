import { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  useParams,
  useSearchParams,
  Link,
  useNavigate,
} from "react-router-dom";
import { Notification, Icon, Row, Col } from "@canonical/react-components";

import { useRemodels } from "../../hooks";
import {
  remodelsListFilterState,
  remodelsListState,
} from "../../state/remodelsState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";
import { setPageTitle, isClosedPanel } from "../../utils";
import { PortalEntrance } from "../Portals/Portals";

import Filter from "../../components/Filter";
import RemodelTable from "./RemodelTable";
import ConfigureRemodelForm from "./ConfigureRemodelForm";

import type { UseQueryResult } from "react-query";
import type { Remodel } from "../../types/shared";

function Remodel(): React.JSX.Element {
  const { id, modelId } = useParams();
  const brandId = useAtomValue(brandIdState);
  const {
    isLoading,
    isError,
    error,
    data,
    refetch,
  }: UseQueryResult<Remodel[], Error> = useRemodels(brandId, modelId);
  const setRemodels = useSetAtom(remodelsListState);
  const setFilter = useSetAtom(remodelsListFilterState);
  const [showNotification, setShowNotification] = useState(false);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const brandStore = useAtomValue(brandStoreState(id));
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  brandStore
    ? setPageTitle(`Remodels in ${brandStore.name}`)
    : setPageTitle("Remodels");

  useEffect(() => {
    if (!isLoading && !isError && data) {
      setRemodels(data);
      setFilter(searchParams.get("filter") || "");
    }
  }, [isLoading, error, data, brandId, id]);

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
        ) : (
          <>
            <Row>
              <Col size={6}>
                <Filter
                  state={remodelsListFilterState}
                  label="Search remodels"
                  placeholder="Search remodels"
                />
              </Col>
              <Col size={6} className="u-align--right">
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
