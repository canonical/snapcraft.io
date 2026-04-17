import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useParams, useSearchParams } from "react-router-dom";
import { Notification, Icon, Row, Col } from "@canonical/react-components";

import { useSerialLogs } from "../../hooks";
import {
  serialLogsListFilterState,
  serialLogsListState,
} from "../../state/serialLogsState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";
import { setPageTitle } from "../../utils";

import Filter from "../../components/Filter";
import SerialLogTable from "./SerialLogTable";

import type { UseQueryResult } from "react-query";
import type { SerialLogResponse, ApiResponse } from "../../types/shared";

function SerialLog(): React.JSX.Element {
  const { id, modelId } = useParams();
  const brandId = useAtomValue(brandIdState);
  const {
    isLoading,
    isError,
    error,
    data,
  }: UseQueryResult<ApiResponse<SerialLogResponse>, Error> = useSerialLogs(
    brandId,
    modelId,
  );
  const setSerialLogs = useSetAtom(serialLogsListState);
  const setFilter = useSetAtom(serialLogsListFilterState);
  const brandStore = useAtomValue(brandStoreState(id));
  const [searchParams] = useSearchParams();

  brandStore
    ? setPageTitle(`Serial logs in ${brandStore.name}`)
    : setPageTitle("Serial logs");

  useEffect(() => {
    if (!isLoading && !isError && data) {
      setSerialLogs(data.data?.items || []);
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
            &nbsp;Fetching serial logs...
          </p>
        ) : data && data.success === false ? (
          <Notification severity="caution">
            {data.message || "Unable to fetch serial logs"}
          </Notification>
        ) : (
          <>
            <Row>
              <Col size={6}>
                <Filter
                  state={serialLogsListFilterState}
                  label="Search serial logs"
                  placeholder="Search serial logs"
                />
              </Col>
            </Row>
            <div className="u-flex-column u-flex-grow">
              <SerialLogTable />
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default SerialLog;
