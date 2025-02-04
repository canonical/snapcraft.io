import { ReactNode } from "react";
import { Row, Col } from "@canonical/react-components";

function LearnHowToSnap(): ReactNode {
  return (
    <div
      style={{
        backgroundImage:
          "url('https://assets.ubuntu.com/v1/e888a79f-suru.png')",
        backgroundPosition: "top right",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#f3f3f3",
        padding: "67px",
      }}
    >
      <Row>
        <Col size={6}>
          <h2>Learn how to snap in 30 minutes</h2>
          <p className="p-heading--4">
            In this section we could introduce any content that we consider
            relevant
          </p>
          <a className="p-button--positive" href="/store">
            Call to action
          </a>
        </Col>
      </Row>
    </div>
  );
}

export default LearnHowToSnap;
