import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useParams } from "react-router-dom";
import { Notification, Icon } from "@canonical/react-components";

import { useSerialLogs } from "../../hooks";
import { serialLogsListState } from "../../state/serialLogsState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";
import { setPageTitle } from "../../utils";

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
  const brandStore = useAtomValue(brandStoreState(id));

  brandStore
    ? setPageTitle(`Serial logs in ${brandStore.name}`)
    : setPageTitle("Serial logs");

  useEffect(() => {
    if (!isLoading && !isError && data) {
      setSerialLogs(data.data?.items || []);
    }
  }, [isLoading, isError, data]);

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
          <div className="u-flex-column u-flex-grow">
            <SerialLogTable />
          </div>
        )}
      </div>
    </>
  );
}

export default SerialLog;
