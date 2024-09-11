import { useParams, NavLink, Link, useSearchParams } from "react-router-dom";
import {
  Row,
  Col,
  SideNavigation,
  Notification,
  Select,
} from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import { useEffect, ChangeEventHandler } from "react";
import { renderMetrics } from "../../../publisher/metrics/metrics";

const EmptyData = () => {
  return (
    <section className="p-strip--light is-shallow">
      <Row>
        <Col size={6}>
          <h2 className="p-heading--4" style={{ marginLeft: "1.5rem" }}>
            Measure your snap's performance
          </h2>
        </Col>
        <Col size={6}>
          <p>
            You'll be able to see active devices and territories when people
            start using your snap.
          </p>
        </Col>
      </Row>
    </section>
  );
};

function Metrics(): JSX.Element {
  const { snapId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const period = searchParams.get("period") ?? "30d";
  const type = searchParams.get("active-devices") ?? "version";

  const {
    nodata,
    latest_active_devices,
    active_devices_annotations,
    territories_total,
    default_track,
    active_devices,
    active_device_metric,
    territories,
  } = window.SNAP_METRICS_DATA;

  useEffect(() => {
    renderMetrics({
      defaultTrack: default_track,
      activeDevices: {
        selector: "#activeDevices",
        metrics: active_devices,
        annotations: active_devices_annotations,
        type: active_device_metric,
      },
      territories: {
        selector: "#territories",
        metrics: territories,
      },
    });
  }, []);

  const onPeriodChange = (event: any) => {
    setSearchParams({ period: event.target.value });
  };

  const onTypeChange = (event: any) => {
    setSearchParams({ "active-devices": event.target.value });
  };

  return (
    <>
      <SectionNav snapName={snapId} activeTab="metrics" />
      {nodata && <EmptyData />}

      <section className={`p-strip is-shallow ${nodata ? "is-empty" : ""}`}>
        <Row>
          <Col size={12} key="activeServices">
            <h4 className="u-float-left">Weekly active devices</h4>
            <div className="p-heading--4 u-float-right u-no-margin--top">
              <strong>{latest_active_devices}</strong>
            </div>
          </Col>
          <Col size={12} key="spearator">
            <hr />
          </Col>
          <Col size={3} key="periodFilter">
            <Select
              className="p-form__control"
              disabled={nodata}
              value={period}
              onChange={onPeriodChange}
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
          <Col size={3} key={"typeFilter"}>
            <Select
              className="p-form__control"
              disabled={nodata}
              value={type}
              onChange={onTypeChange}
              options={[
                { label: "By version", value: "version" },
                { label: "By OS", value: "os" },
                { label: "By channel", value: "channel" },
                { label: "By architecture", value: "architecture" },
              ]}
            />
          </Col>
          <Col size={12} key="info">
            <div
              id="activeDevices"
              className="snapcraft-metrics__graph snapcraft-metrics__active-devices"
            >
              <div id="area-holder">
                <svg width="100%" height="320"></svg>
              </div>
              <Row data-js="annotations-hover">
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
              </Row>
            </div>
          </Col>
        </Row>
      </section>
      <section className={`p-strip is-shallow ${nodata ? "is-empty" : ""}`}>
        <Row>
          <Col size={12} key="territoriesInfo">
            <h1 className="u-float-left p-heading--4">Territories</h1>
            <div className="p-heading--4 u-float-right u-no-margin--top">
              <strong>{territories_total}</strong>
            </div>
          </Col>
          <Col size={12} key="territoriesSeparator">
            <hr />
          </Col>
          <Col size={12} key="territories">
            <div id="territories" className="snapcraft-territories"></div>
          </Col>
        </Row>
      </section>
    </>
  );
}

export default Metrics;
