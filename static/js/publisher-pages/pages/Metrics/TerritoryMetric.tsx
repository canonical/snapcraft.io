import { useParams, useSearchParams } from "react-router-dom";
import {
  Row,
  Col,
  Select,
  Spinner,
  CodeSnippet,
} from "@canonical/react-components";

import { useEffect, useState } from "react";
import { renderTerritoriesMetrics } from "../../../publisher/metrics/metrics";

export const TerritoryMetric = ({
  isEmpty,
}: {
  isEmpty: boolean;
}): JSX.Element => {
  const { snapId } = useParams();
  const [countryInfo, setCountryInfo] = useState<{
    active_devices: any;
    territories_total: number;
  } | null>(null);

  const [loadingActiveDeviceMetric, setLoadingActiveDeviceMetric] =
    useState(true);
  const [errorOnActiveDeviceMetric, setErrorOnActiveDeviceMetric] =
    useState(false);

  const fetchActiveDeviceMetric = async () => {
    setErrorOnActiveDeviceMetric(false);
    setLoadingActiveDeviceMetric(true);
    const response = await fetch(`/${snapId}/metrics/country-metric`);

    if (!response.ok) {
      setErrorOnActiveDeviceMetric(true);
      setLoadingActiveDeviceMetric(false);
      return;
    }

    const data = await response.json();
    setCountryInfo(data);
    renderTerritoriesMetrics({
      selector: "#territories",
      metrics: data.active_devices,
    });

    setLoadingActiveDeviceMetric(false);
  };

  useEffect(() => {
    void fetchActiveDeviceMetric();
  }, []);

  return (
    <section className={`p-strip is-shallow ${isEmpty ? "is-empty" : ""}`}>
      <Row>
        <Col size={12} key="activeServices">
          <h1 className="u-float-left p-heading--4">Territories</h1>
          <div className="p-heading--4 u-float-right u-no-margin--top">
            <strong>{countryInfo?.territories_total}</strong>
          </div>
        </Col>
        <Col size={12} key="territoriesSeparator">
          <hr />
        </Col>
        {loadingActiveDeviceMetric ? (
          <Spinner />
        ) : (
          errorOnActiveDeviceMetric && (
            <CodeSnippet
              blocks={[
                {
                  code: <div>Error on loading metrics...</div>,
                  wrapLines: true,
                },
              ]}
            />
          )
        )}

        <Col size={12} key="territories">
          <div id="territories" className="snapcraft-territories"></div>
        </Col>
      </Row>
    </section>
  );
};
