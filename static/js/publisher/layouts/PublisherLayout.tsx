import {
  AppMain,
  Application,
  Col,
  Panel,
  Row,
  applyTheme,
  loadTheme,
} from "@canonical/react-components";
import { useCallback, useEffect } from "react";
import { Outlet } from "react-router-dom";

import Navigation from "../components/Navigation";
import useSideNavigationData from "../hooks/useSideNavigationData";
import { usePortalExit } from "../pages/Portals/Portals";

function PublisherLayout(): React.JSX.Element {
  useSideNavigationData();
  const asidePortalRef = usePortalExit("aside");
  const notificationPortalRef = usePortalExit("notification");
  const modalPortalRef = usePortalExit("modal");

  // merge two ref callbacks into one
  const mergedPortalsRef = useCallback<React.RefCallback<HTMLElement>>(
    (node) => {
      asidePortalRef(node);
      modalPortalRef(node);
    },
    [asidePortalRef, modalPortalRef]
  );

  useEffect(() => {
    const theme = loadTheme();
    applyTheme(theme);
  }, []);

  return (
    <Application ref={mergedPortalsRef}>
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

      <div className="p-notification-center" ref={notificationPortalRef}></div>
    </Application>
  );
}

export default PublisherLayout;
