import { useState } from "react";
import { Outlet } from "react-router-dom";

import {
  ApplicationLayout,
  Panel,
  Row,
  Col,
} from "@canonical/react-components";

function Root(): JSX.Element {
  const [menuPinned, setMenuPinned] = useState<boolean>(false);
  const [menuCollapsed, setMenuCollapsed] = useState<boolean>(false);

  return (
    <ApplicationLayout
      menuPinned={menuPinned}
      onPinMenu={setMenuPinned}
      menuCollapsed={menuCollapsed}
      onCollapseMenu={setMenuCollapsed}
      logo={{
        icon: "https://assets.ubuntu.com/v1/dae35907-Snapcraft%20tag.svg",
        name: "https://assets.ubuntu.com/v1/6cd1a881-snapcraft_logo_white.svg",
        nameAlt: "Snapcraft",
        href: "/",
      }}
      navItems={[
        {
          items: [
            {
              label: "My snaps",
              href: "/snaps",
              icon: "pods",
            },
            {
              label: "My validation sets",
              href: "/validation-sets",
              icon: "pods",
            },
          ],
        },
        {
          style: {
            bottom: 0,
            position: "absolute",
            width: "100%",
          },
          items: [
            {
              label: "My account",
              href: "/admin/account",
              icon: "user",
            },
            {
              label: "Logout",
              href: "/logout",
              icon: "begin-downloading",
            },
          ],
        },
      ]}
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

export default Root;
