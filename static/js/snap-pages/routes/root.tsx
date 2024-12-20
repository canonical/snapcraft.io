import { Outlet } from "react-router-dom";
import { Panel, Row, Col } from "@canonical/react-components";

// import Logo from "../components/Logo";
// import PrimaryNav from "../components/PrimaryNav";

function Root(): JSX.Element {
  return (
    <>
      <div id="main-content">
        <Panel>
          {/* <Row>
            <Col size={12}> */}
          <Outlet />
          {/* </Col>
          </Row> */}
        </Panel>
      </div>
    </>
  );
}

export default Root;
