import {
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

function PublisherLayout(): React.JSX.Element {
  const [collapseNavigation, setCollapseNavigation] = useLocalStorage<boolean>(
    "collapse-nav",
    false,
  );
  const [pinSideNavigation, setPinSideNavigation] = useLocalStorage<boolean>(
    "pin-nav",
    false,
  );

  useEffect(() => {
    const theme = loadTheme();
    applyTheme(theme);
  }, []);

  return (
    <ApplicationLayout
      menuCollapsed={collapseNavigation}
      onCollapseMenu={setCollapseNavigation}
      menuPinned={pinSideNavigation}
      onPinMenu={setPinSideNavigation}
      logo={<Logo />}
      sideNavigation={
        <PrimaryNav
          collapseNavigation={collapseNavigation}
          setCollapseNavigation={setCollapseNavigation}
        />
      }
    >
      <Panel>
        <Row>
          <Col size={12}>
            <Outlet />
          </Col>
        </Row>
      </Panel>
    </ApplicationLayout>
  );
}

export default PublisherLayout;
