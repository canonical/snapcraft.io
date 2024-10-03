import { useParams, NavLink } from "react-router-dom";
import {
  Row,
  Col,
  SideNavigation,
  Strip,
  Notification,
} from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import PubliciseButtons from "./PubliciseButtons";
import PubliciseBadges from "./PubliciseBadges";
import PubliciseCards from "./PubliciseCards";

type Props = {
  view?: undefined | "badges" | "cards";
};

function Publicise({ view }: Props): JSX.Element {
  const { snapId } = useParams();

  const disableView = () => {
    if (window.SNAP_PUBLICISE_DATA.private) {
      return true;
    }

    if (!window.SNAP_PUBLICISE_DATA.isReleased) {
      return true;
    }

    return false;
  };

  return (
    <>
      <h1 className="p-heading--4">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /
        Publicise
      </h1>

      <SectionNav snapName={snapId} activeTab="publicise" />

      <Strip shallow>
        {disableView() && (
          <Notification severity="information">
            When your snap is public and has a release, you'll be able to share
            it using Store buttons, badges and embeddable cards. Make your snap
            public in its <a href={`/${snapId}/settings`}>settings page</a>.
          </Notification>
        )}
        <Row className={window.SNAP_PUBLICISE_DATA.private ? "u-disabled" : ""}>
          <Col size={3}>
            <SideNavigation
              items={[
                {
                  items: [
                    {
                      "aria-current": !view,
                      label: "Snap Store buttons",
                      to: `/${snapId}/publicise`,
                      component: NavLink,
                    },
                    {
                      "aria-current": view === "badges",
                      label: "GitHub badges",
                      to: `/${snapId}/publicise/badges`,
                      component: NavLink,
                    },
                    {
                      "aria-current": view === "cards",
                      label: "Embeddable cards",
                      to: `/${snapId}/publicise/cards`,
                      component: NavLink,
                    },
                  ],
                },
              ]}
            />
          </Col>
          <Col size={9}>
            {!view && <PubliciseButtons />}
            {view === "badges" && <PubliciseBadges />}
            {view === "cards" && <PubliciseCards />}
          </Col>
        </Row>
      </Strip>
    </>
  );
}

export default Publicise;
