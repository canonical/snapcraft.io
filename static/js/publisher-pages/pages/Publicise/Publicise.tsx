import { useParams, NavLink } from "react-router-dom";
import { Row, Col, SideNavigation } from "@canonical/react-components";

import PubliciseButtons from "./PubliciseButtons";
import PubliciseBadges from "./PubliciseBadges";
import PubliciseCards from "./PubliciseCards";

type Props = {
  view?: undefined | "badges" | "cards";
};

function Publicise({ view }: Props): JSX.Element {
  const { snapId } = useParams();

  return (
    <>
      <h1 className="p-heading--4">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /
        Publicise
      </h1>

      <nav className="p-tabs">
        <ul className="p-tabs__list">
          <li className="p-tabs__item">
            <a href={`/${snapId}/listing`} className="p-tabs__link">
              Listing
            </a>
          </li>
          <li className="p-tabs__item">
            <a href={`/${snapId}/builds`} className="p-tabs__link">
              Builds
            </a>
          </li>
          <li className="p-tabs__item">
            <a href={`/${snapId}/releases`} className="p-tabs__link">
              Releases
            </a>
          </li>
          <li className="p-tabs__item">
            <a href={`/${snapId}/metrics`} className="p-tabs__link">
              Metrics
            </a>
          </li>
          <li className="p-tabs__item">
            <a
              href={`/${snapId}/publicise`}
              className="p-tabs__link"
              aria-selected="true"
            >
              Publicise
            </a>
          </li>
          <li className="p-tabs__item">
            <a href={`/${snapId}/settings`} className="p-tabs__link">
              Settings
            </a>
          </li>
        </ul>
      </nav>

      <Row>
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
    </>
  );
}

export default Publicise;
