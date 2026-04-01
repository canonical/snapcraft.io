import { useAtomValue, useSetAtom } from "jotai";
import { useParams, useSearchParams } from "react-router-dom";
import { Notification, Icon, Row, Col } from "@canonical/react-components";

import { useSerialLogs } from "../../hooks";
import {
  serialLogsListState,
  serialLogsListFilterState,
} from "../../state/serialLogsState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";
import { setPageTitle } from "../../utils";

import Filter from "../../components/Filter";
import SerialLogsTable from "./SerialLogsTable";

import type { UseQueryResult } from "react-query";
import type { SerialLog } from "../../types/shared";
import { useEffect } from "react";

function SerialLogs() {
  const { id, modelId } = useParams();
  const brandId = useAtomValue(brandIdState);
  const {
    isLoading,
    isError,
    error,
    data,
  }: UseQueryResult<SerialLog[], Error> = useSerialLogs(brandId, modelId);
  const setSerialLogs = useSetAtom(serialLogsListState);
  const setFilter = useSetAtom(serialLogsListFilterState);
  const brandStore = useAtomValue(brandStoreState(id));
  const [searchParams] = useSearchParams();

  brandStore
    ? setPageTitle(`Serial logs for ${modelId} in ${brandStore.name}`)
    : setPageTitle("Serial logs");

  useEffect(() => {
    if (!isLoading && !isError && data) {
      setSerialLogs(data);
      setFilter(searchParams.get("filter") || "");
    }
  }, [isLoading, data, error, brandId, id]);

  return (
    <div className="u-fixed-width u-flex-column u-flex-grow">
      {isError && error && (
        <Notification severity="negative">Error: {error.message}</Notification>
      )}
      {isLoading ? (
        <p>
          <Icon name="spinner" className="u-animation--spin" />
          &nbsp;Fetching serial logs...
        </p>
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
            <SerialLogsTable />
          </div>
        </>
      )}
    </div>
  );
}

export default SerialLogs;
