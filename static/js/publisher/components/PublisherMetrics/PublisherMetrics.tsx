import { Col, Notification, Row, Strip } from "@canonical/react-components";
import { renderPublisherMetrics } from "../../../publisher/pages/Metrics/metrics/metrics";
import { useEffect } from "react";
import { useFetchPublishedSnapMetrics } from "../../hooks";

import type { ISnap } from "../../types";

function PublisherMetrics({ snaps }: { snaps: ISnap[] }): React.JSX.Element {
  const { status, data: metricsData } = useFetchPublishedSnapMetrics(snaps);

  useEffect(() => {
    if (metricsData) {
      renderPublisherMetrics({
        snaps: metricsData,
      });
    }
  }, [metricsData]);

  const daysWithoutDataExist =
    metricsData && metricsData.daysWithoutData.length > 0;
  return (
    <Strip
      className="u-no-padding--top"
      element="section"
      shallow
      data-js="dashboard-metrics"
    >
      <Row>
        <Col
          size={12}
          className="snap-installs-container snapcraft-metrics__graph snapcraft-metrics__active-devices"
        >
          {daysWithoutDataExist && (
            <Notification severity="caution">
              Metrics for the most recent days may be incomplete or missing.
              They will be updated and accurate within a few hours.
            </Notification>
          )}
          <svg width="100%" height="240"></svg>
          {metricsData && metricsData.buckets.length === 0 && (
            <div className="p-snap-list__metrics-empty-message">
              No data found for{" "}
              {snaps
                .map((snap) => snap.snapName)
                .reduce((curr, acc) => `${curr}, ${acc}`)}
            </div>
          )}
          {status === "loading" && (
            <div className="snapcraft-metrics__loader">
              <i className="p-icon--spinner u-animation--spin"></i>
            </div>
          )}

          {status === "error" && (
            <div className="u-fixed-width">
              <Notification severity="negative" title="Error:">
                Something went wrong. Please try again later.
              </Notification>
            </div>
          )}
        </Col>
      </Row>
    </Strip>
  );
}

export default PublisherMetrics;
