import { useParams, useSearchParams } from "react-router-dom";
import { Row, Col, Spinner, CodeSnippet } from "@canonical/react-components";

import { useEffect, useState } from "react";
import { renderActiveDevicesMetrics } from "../../../publisher/metrics/metrics";
import { select } from "d3-selection";
import ActiveDeviceAnnotation from "./ActiveDeviceAnnotation";
import { ActiveDeviceMetricFilter } from "./ActiveDeviceMetricFilter";

function ActiveDeviceMetric({
  isEmpty,
  onDataLoad,
}: {
  isEmpty: boolean;
  onDataLoad: (dataLength: number | undefined) => void;
}): JSX.Element {
  const { snapId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [latestActiveDevices, setLatestActiveDevices] = useState<number | null>(
    null
  );
  const [requestStatus, setRequestStatus] = useState<
    "loading" | "error" | "successful"
  >("loading");

  const period = searchParams.get("period") ?? "30d";
  const type = searchParams.get("active-devices") ?? "version";

  const fetchActiveDeviceMetric = async () => {
    // clear the chart
    const selector = "#activeDevices";
    const svg = select(`${selector} svg`);
    svg.selectAll("*").remove();

    setRequestStatus("loading");

    const response = await fetch(
      `/${snapId}/metrics/active-devices?period=${period}&active-devices=${type}`
    );
    if (!response.ok) {
      if (response.status === 404) {
        onDataLoad(0);
        setRequestStatus("successful");
      } else {
        setRequestStatus("error");
      }
      return;
    }

    const data = await response.json();
    setLatestActiveDevices(parseFloat(data.latest_active_devices));
    renderActiveDevicesMetrics({
      selector,
      metrics: data.active_devices,
      type,
    });

    onDataLoad(data.active_devices?.buckets?.length);
    setRequestStatus("successful");
  };

  useEffect(() => {
    void fetchActiveDeviceMetric();
  }, [period, type]);

  const onChange = (key: string, value: string) => {
    setSearchParams((searchParams) => {
      searchParams.set(key, value);
      return searchParams;
    });
  };

  return (
    <section className={`p-strip is-shallow ${isEmpty ? "is-empty" : ""}`}>
      <Row>
        <Col size={12} key="activeServices">
          <h4 className="u-float-left">Weekly active devices</h4>
          <div className="p-heading--4 u-float-right u-no-margin--top">
            <strong>
              {latestActiveDevices &&
                String(latestActiveDevices).replace(/(.)(?=(\d{3})+$)/g, "$1,")}
            </strong>
          </div>
        </Col>
        <Col size={12} key="spearator">
          <hr />
        </Col>
        {requestStatus === "loading" ? (
          <Spinner />
        ) : (
          <>
            <ActiveDeviceMetricFilter
              isEmpty={isEmpty}
              onChange={onChange}
              period={period}
              type={type}
            />
            {isEmpty && <div>No data</div>}
            {requestStatus === "error" && (
              <CodeSnippet
                blocks={[
                  {
                    code: <div>Error on loading metrics...</div>,
                    wrapLines: true,
                  },
                ]}
              />
            )}
          </>
        )}

        <Col size={12} key="info">
          <div>
            <div
              id="activeDevices"
              className="snapcraft-metrics__graph snapcraft-metrics__active-devices"
            >
              <div id="area-holder">
                <svg width="100%" height="320"></svg>
              </div>
            </div>

            <ActiveDeviceAnnotation />
          </div>
        </Col>
      </Row>
    </section>
  );
}

export default ActiveDeviceMetric;
