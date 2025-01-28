import { useParams, NavLink } from "react-router-dom";
import { useQuery } from "react-query";
import {
  Row,
  Col,
  SideNavigation,
  Strip,
  Notification,
  Icon,
} from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import PubliciseButtons from "./PubliciseButtons";
import PubliciseBadges from "./PubliciseBadges";
import PubliciseCards from "./PubliciseCards";

import { setPageTitle } from "../../utils";

type Props = {
  view?: undefined | "badges" | "cards";
};

function Publicise({ view }: Props): JSX.Element {
  const { snapId } = useParams();

  const { data, isLoading, isFetched } = useQuery({
    queryKey: ["publiciseData"],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/publicise`);

      if (!response.ok) {
        throw new Error("There was a problem loading publicise data");
      }

      const data = await response.json();

      return data.data;
    },
  });

  const disableView = () => {
    if (data.private) {
      return true;
    }

    if (!data.is_released) {
      return true;
    }

    return false;
  };

  setPageTitle(`Publicise ${snapId}`);

  return (
    <>
      <h1 className="p-heading--4" aria-live="polite">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /
        Publicise
      </h1>

      <SectionNav snapName={snapId} activeTab="publicise" />

      {isLoading && (
        <Strip shallow>
          <p>
            <Icon name="spinner" className="u-animation--spin" />
            &nbsp;Loading...
          </p>
        </Strip>
      )}

      {isFetched && data && (
        <Strip shallow>
          {disableView() && (
            <Notification severity="information">
              When your snap is public and has a release, you'll be able to
              share it using Store buttons, badges and embeddable cards. Make
              your snap public in its{" "}
              <a href={`/${snapId}/settings`}>settings page</a>.
            </Notification>
          )}
          <Row className={data.private ? "u-disabled" : ""}>
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
              {view === "badges" && (
                <PubliciseBadges trending={data.trending} />
              )}
              {view === "cards" && <PubliciseCards />}
            </Col>
          </Row>
        </Strip>
      )}
    </>
  );
}

export default Publicise;
