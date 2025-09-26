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
import useSideNavigationData from "../hooks/useSideNavigationData";
import { usePortalExit } from "../pages/Portals/Portals";
import useMergeRefs from "../hooks/useMergeRefs";

function PublisherLayout(): React.JSX.Element {
  useSideNavigationData();
  // merge two ref callbacks into one
  const mergedPortalsRef = useMergeRefs<HTMLDivElement>(
    usePortalExit("aside"),
    usePortalExit("modal"),
  );
  const notificationPortalRef = usePortalExit("notification");

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
