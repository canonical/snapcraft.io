import { useEffect, useState, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useParams, useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const brandId = useAtomValue(brandIdState);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const cursorHistory = useRef<Array<string | null>>([]);

  const pageSizeParam = searchParams.get("page-size");
  const parsedPageSize = pageSizeParam ? parseInt(pageSizeParam) : NaN;
  const startTime = searchParams.get("start-time");
  const endTime = searchParams.get("end-time");
  const pageSize = Number.isInteger(parsedPageSize) ? parsedPageSize : 25;
  const params = {
    pageSize: pageSize,
    page: currentCursor,
    ...(startTime && endTime && { interval: { startTime, endTime } }),
  };

  const {
    isLoading,
    isError,
    error,
    data,
  }: UseQueryResult<ApiResponse<SerialLogResponse>, Error> = useSerialLogs(
    brandId,
    modelId,
    params,
  );
  const setSerialLogs = useSetAtom(serialLogsListState);
  const brandStore = useAtomValue(brandStoreState(id));

  const handlePageForward = () => {
    cursorHistory.current.push(currentCursor);
    setCurrentCursor(nextCursor);
  };

  const handlePageBack = () => {
    const lastCursor = cursorHistory.current.pop();
    setCurrentCursor(lastCursor || null);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    // Need to reset current page when changing page size
    // because otherwise the cursor history gets out of sync
    setCurrentCursor(null);
    cursorHistory.current = [];
    setSearchParams((params) => {
      params.set("page-size", newPageSize.toString());
      return params;
    });
  };

  brandStore
    ? setPageTitle(`Serial logs in ${brandStore.name}`)
    : setPageTitle("Serial logs");

  useEffect(() => {
    if (isLoading || isError) {
      return;
    }

    if (data) {
      setSerialLogs(data.data?.items || []);
      setNextCursor(data.data?.["next-cursor"] || null);
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
            <SerialLogTable
              handlePageForward={handlePageForward}
              handlePageBack={handlePageBack}
              handlePageSizeChange={handlePageSizeChange}
              forwardDisabled={!nextCursor}
              backDisabled={
                cursorHistory.current.length < 1 || currentCursor === null
              }
              pageSize={pageSize}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default SerialLog;
