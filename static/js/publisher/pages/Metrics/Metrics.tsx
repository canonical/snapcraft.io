import { useParams } from "react-router-dom";
import { Row, Col } from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import ActiveDeviceMetrics from "./ActiveDeviceMetrics";
import { TerritoryMetrics } from "./TerritoryMetrics";
import { useState } from "react";

import { setPageTitle } from "../../utils";

const EmptyData = () => {
  return (
    <section className="p-strip--light is-shallow snapcraft-metrics__info">
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

function Metrics(): React.JSX.Element {
  const { snapId } = useParams();

  const [isActiveDeviceMetricEmpty, setIsActiveDeviceMetricEmpty] = useState<
    boolean | null
  >(null);
  const [isCountryMetricEmpty, setIsCountryMetricEmpty] = useState<
    boolean | null
  >(null);
  const isEmpty =
    Boolean(isActiveDeviceMetricEmpty) && Boolean(isCountryMetricEmpty);

  setPageTitle(`Metrics for ${snapId}`);

  return (
    <>
      <h1 className="p-heading--4" aria-live="polite">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /
        Metrics
      </h1>

      <SectionNav snapName={snapId} activeTab="metrics" />
      {isEmpty && <EmptyData />}

      <ActiveDeviceMetrics
        isEmpty={isEmpty}
        onDataLoad={(dataLength) => setIsActiveDeviceMetricEmpty(!dataLength)}
      />
      <TerritoryMetrics
        isEmpty={isEmpty}
        onDataLoad={(dataLength) => setIsCountryMetricEmpty(!dataLength)}
      />
    </>
  );
}

export default Metrics;
