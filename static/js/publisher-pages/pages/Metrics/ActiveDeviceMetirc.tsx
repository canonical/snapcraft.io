import { useParams, useSearchParams } from "react-router-dom";
import { Row, Col, Select } from "@canonical/react-components";

import { useEffect, useState } from "react";
import { renderActiveDevicesMetrics } from "../../../publisher/metrics/metrics";
import { select } from "d3-selection";

function ActiveDeviceMetric({ isEmpty }: { isEmpty: boolean }): JSX.Element {
  const { snapId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [latestActiveDevices, setLatestActiveDevices] = useState<number | null>(
    null
  );
  const [loadingActiveDeviceMetric, setLoadingActiveDeviceMetric] =
    useState(true);
  const [errorOnActiveDeviceMetric, setErrorOnActiveDeviceMetric] =
    useState(false);

  const period = searchParams.get("period") ?? "30d";
  const type = searchParams.get("active-devices") ?? "version";

  const fetchActiveDeviceMetric = async () => {
    // clear chart
    const selector = "#activeDevices";
    const svg = select(`${selector} svg`);
    svg.selectAll("*").remove();

    setErrorOnActiveDeviceMetric(false);
    setLoadingActiveDeviceMetric(true);
    const response = await fetch(
      `/${snapId}/metrics/active-devices?period=${period}&active-devices=${type}`
    );

    if (!response.ok) {
      setErrorOnActiveDeviceMetric(true);
      setLoadingActiveDeviceMetric(false);
      return;
    }

    const data = await response.json();
    setLatestActiveDevices(parseFloat(data.latest_active_devices));
    renderActiveDevicesMetrics({
      selector,
      metrics: data.active_devices,
      type,
    });
    setLoadingActiveDeviceMetric(false);
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
        {loadingActiveDeviceMetric ? (
          <div>Loading....</div>
        ) : errorOnActiveDeviceMetric ? (
          <div>Error on loading metrics...</div>
        ) : (
          <>
            <Col size={3} key="periodFilter">
              <Select
                className="p-form__control"
                disabled={isEmpty}
                value={period}
                onChange={(event) => onChange("period", event.target.value)}
                options={[
                  {
                    label: "Past 7 days",
                    value: "7d",
                  },
                  {
                    label: "Past 30 days",
                    value: "30d",
                  },
                  {
                    label: "Past 3 months",
                    value: "3m",
                  },
                  {
                    label: "Past 6 months",
                    value: "6m",
                  },
                  {
                    label: "Past year",
                    value: "1y",
                  },
                  {
                    label: "Past 2 years",
                    value: "2y",
                  },
                  {
                    label: "Past 5 years",
                    value: "5y",
                  },
                ]}
              />
            </Col>
            <Col size={3} key="typeFilter">
              <Select
                className="p-form__control"
                disabled={isEmpty}
                value={type}
                onChange={(event) =>
                  onChange("active-devices", event.target.value)
                }
                options={[
                  { label: "By version", value: "version" },
                  { label: "By OS", value: "os" },
                  { label: "By channel", value: "channel" },
                  { label: "By architecture", value: "architecture" },
                ]}
              />
            </Col>
          </>
        )}

        <Col size={12} key="info">
          <div
            id="activeDevices"
            className="snapcraft-metrics__graph snapcraft-metrics__active-devices"
          >
            <div id="area-holder">
              <svg width="100%" height="320"></svg>
            </div>
            {/* <Row data-js="annotations-hover">
                {active_devices_annotations.series.map((category) => (
                  <Col size={4}>
                    <p
                      data-js="annotation-hover"
                      data-id={`category-${category.name}`}
                    >
                      {category.name == "featured" ? (
                        <>
                          ⭐{" "}
                          <small>
                            <b>Featured</b> snap since{" "}
                            <b>{category.display_date}</b>
                          </small>
                        </>
                      ) : (
                        <>
                          🗂{" "}
                          <small>
                            Added to <b>{category.display_name}</b> in{" "}
                            <b>{category.display_date}</b>
                          </small>
                        </>
                      )}
                    </p>
                  </Col>
                ))}
              </Row> */}
          </div>
        </Col>
      </Row>
    </section>
  );
}

export default ActiveDeviceMetric;
