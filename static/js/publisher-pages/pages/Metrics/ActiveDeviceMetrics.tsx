import { useParams, useSearchParams } from "react-router-dom";
import { Row, Col, Spinner, CodeSnippet } from "@canonical/react-components";

import { useEffect } from "react";
import { renderActiveDevicesMetrics } from "./metrics/metrics";
import { select } from "d3-selection";
import ActiveDeviceAnnotation from "./ActiveDeviceAnnotation";
import { ActiveDeviceMetricFilter } from "./ActiveDeviceMetricFilter";
import useActiveDeviceMetrics from "../../hooks/useActiveDeviceMetrics";
import useLatestActiveDevicesMetric from "../../hooks/useLatestActiveDevicesMetric";

function ActiveDeviceMetrics({
  isEmpty,
  onDataLoad,
}: {
  isEmpty: boolean;
  onDataLoad: (dataLength: number | undefined) => void;
}): JSX.Element {
  const { snapId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: latestActiveDevices } = useLatestActiveDevicesMetric(snapId);

  const period = searchParams.get("period") ?? "30d";
  const type = searchParams.get("active-devices") ?? "version";

  const selector = "#activeDevices";

  const { status, data, isFetching } = useActiveDeviceMetrics({
    snapId,
    period,
    type,
  });

  useEffect(() => {
    if (data) {
      if (data.activeDevices) {
        renderActiveDevicesMetrics({
          selector,
          metrics: data.activeDevices,
          type,
        });
      }

      onDataLoad(data.activeDevices?.buckets?.length);
    }
  }, [data]);

  const onChange = (key: string, value: string) => {
    // clear the chart
    const svg = select(`${selector} svg`);
    svg.selectAll("*").remove();

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
            <strong>{latestActiveDevices}</strong>
          </div>
        </Col>
        <Col size={12} key="spearator">
          <hr />
        </Col>
        {isFetching ? (
          <Spinner />
        ) : (
          <>
            <ActiveDeviceMetricFilter
              isEmpty={isEmpty}
              onChange={onChange}
              period={period}
              type={type}
            />
            {isEmpty && <div>No data found.</div>}
            {status === "error" && (
              <CodeSnippet
                blocks={[
                  {
                    code: <div>An error occurred. Please try again.</div>,
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

            <ActiveDeviceAnnotation snapId={snapId} />
          </div>
        </Col>
      </Row>
    </section>
  );
}

export default ActiveDeviceMetrics;
