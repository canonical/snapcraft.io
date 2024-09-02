import { useParams, NavLink, Link } from "react-router-dom";
import { Tabs } from "@canonical/react-components";

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
        <Link to="/snaps">My snaps</Link> /{" "}
        <Link to={`/${snapId}`}>{snapId}</Link> / Publicise
      </h1>

      <Tabs
        links={[
          {
            active: !view,
            label: "Snap Store buttons",
            to: `/${snapId}/publicise`,
            component: NavLink,
          },
          {
            active: view === "badges",
            label: "GitHub badges",
            to: `/${snapId}/publicise/badges`,
            component: NavLink,
          },
          {
            active: view === "cards",
            label: "Embeddable cards",
            to: `/${snapId}/publicise/cards`,
            component: NavLink,
          },
        ]}
      />

      {!view && <PubliciseButtons />}

      {view === "badges" && <PubliciseBadges />}

      {view === "cards" && <PubliciseCards />}
    </>
  );
}

export default Publicise;
