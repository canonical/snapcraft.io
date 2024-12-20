import { Col, Notification, Row, Strip } from "@canonical/react-components";
import { ISnap } from "../../types";
import { renderPublisherMetrics } from "../../../publisher/metrics/metrics";
import { useEffect } from "react";
import { useFetchPublishedSnapMetrics } from "../../hooks";

export const PublisherMetrics = ({ snaps }: { snaps: ISnap[] }) => {
  const { status, data: metricsData } = useFetchPublishedSnapMetrics(snaps);

  useEffect(() => {
    if (metricsData) {
      renderPublisherMetrics({
        snaps: metricsData,
      });
    }
  }, [metricsData]);

  return (
    <Strip element="section" shallow data-js="dashboard-metrics">
      <div className="u-fixed-width">
        <h2 className="p-heading--4">Snap installs</h2>
      </div>
      <Row>
        <Col
          size={12}
          className="snap-installs-container snapcraft-metrics__graph snapcraft-metrics__active-devices"
        >
          <svg width="100%" height="240"></svg>
          {metricsData && metricsData.buckets.length === 0 && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
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
};
