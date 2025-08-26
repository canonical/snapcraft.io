import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import {
  ApplicationLayout,
  Panel,
  Row,
  Col,
  applyTheme,
  loadTheme,
} from "@canonical/react-components";

import Logo from "../components/Logo";
import PrimaryNav from "../components/PrimaryNav";

function PublisherRoot(): React.JSX.Element {
  const [collapseNavigation, setCollapseNavigation] = useState<boolean>(false);

  useEffect(() => {
    const theme = loadTheme();
    applyTheme(theme);
  }, []);

  return (
    <ApplicationLayout
      menuCollapsed={collapseNavigation}
      onCollapseMenu={setCollapseNavigation}
      logo={<Logo />}
      sideNavigation={
        <PrimaryNav
          collapseNavigation={collapseNavigation}
          setCollapseNavigation={setCollapseNavigation}
        />
      }
    >
      <div id="main-content" className="publisher-app">
        <Panel>
          <Row>
            <Col size={12}>
              <Outlet />
            </Col>
          </Row>
        </Panel>
      </div>
    </ApplicationLayout>
  );
}

export default PublisherRoot;
