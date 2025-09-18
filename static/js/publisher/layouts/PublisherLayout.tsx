import {
  AppMain,
  Application,
  ApplicationLayout,
  Col,
  Panel,
  Row,
  applyTheme,
  loadTheme,
} from "@canonical/react-components";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Logo from "../components/Logo";
import PrimaryNav from "../components/PrimaryNav";
import useLocalStorage from "../hooks/useLocalStorage";
import Navigation from "../components/Navigation";

function PublisherLayout(): React.JSX.Element {
  const [collapseNavigation, setCollapseNavigation] = useLocalStorage<boolean>(
    "collapse-nav",
    false
  );
  const [pinSideNavigation, setPinSideNavigation] = useLocalStorage<boolean>(
    "pin-nav",
    false
  );

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
