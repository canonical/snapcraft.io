import { useParams } from "react-router-dom";
import { Row, Col } from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import ActiveDeviceMetric from "./ActiveDeviceMetirc";

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

  //   const isEmpty = active_devices.buckets.length === 0;
  const isEmpty = false;

  return (
    <>
      <SectionNav snapName={snapId} activeTab="metrics" />
      {isEmpty && <EmptyData />}

      <ActiveDeviceMetric isEmpty={isEmpty} />
      {/* <section className={`p-strip is-shallow ${isEmpty ? "is-empty" : ""}`}>
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
      </section> */}
    </>
  );
}

export default Metrics;
