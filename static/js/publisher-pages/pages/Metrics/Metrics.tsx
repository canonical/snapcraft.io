import { useParams, useSearchParams } from "react-router-dom";
import { Row, Col } from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import ActiveDeviceMetrics from "./ActiveDeviceMetrics";
import { TerritoryMetric } from "./TerritoryMetric";
import { useState } from "react";

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

  const [isActiveDeviceMetricEmpty, setIsActiveDeviceMetricEmpty] = useState<
    boolean | null
  >(null);
  const [isCountryMetricEmpty, setIsCountryMetricEmpty] = useState<
    boolean | null
  >(null);
  const isEmpty =
    Boolean(isActiveDeviceMetricEmpty) && Boolean(isCountryMetricEmpty);

  return (
    <>
      <SectionNav snapName={snapId} activeTab="metrics" />
      {isEmpty && <EmptyData />}

      <ActiveDeviceMetrics
        isEmpty={isEmpty}
        onDataLoad={(dataLength) => setIsActiveDeviceMetricEmpty(!dataLength)}
      />
      <TerritoryMetric
        isEmpty={isEmpty}
        onDataLoad={(dataLength) => setIsCountryMetricEmpty(!dataLength)}
      />
    </>
  );
}

export default Metrics;
