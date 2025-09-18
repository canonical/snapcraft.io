import {
  AppMain,
  Application,
  Col,
  Panel,
  Row,
  applyTheme,
  loadTheme,
} from "@canonical/react-components";
import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import Navigation from "../components/Navigation";

function PublisherLayout(): React.JSX.Element {
  useEffect(() => {
    const theme = loadTheme();
    applyTheme(theme);
  }, []);

  return (
    <Application>
      <Navigation />
      <AppMain>
        <Panel>
          <Row>
            <Col size={12}>
              <Outlet />
            </Col>
          </Row>
        </Panel>
      </AppMain>
    </Application>
  );
}

export default PublisherLayout;
