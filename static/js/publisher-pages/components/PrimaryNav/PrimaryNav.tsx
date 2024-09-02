import { useParams, useLocation } from "react-router-dom";
import {
  SideNavigation,
  SideNavigationText,
} from "@canonical/react-components";

import { usePublisher } from "../../../brand-store/hooks";

function PrimaryNav({
  collapseNavigation,
  setCollapseNavigation,
}: {
  collapseNavigation: boolean;
  setCollapseNavigation: Function;
}): JSX.Element {
  const { snapId } = useParams();
  const location = useLocation();
  const { data: publisherData } = usePublisher();

  const isPublicisePage = (): boolean => {
    if (location.pathname === `/${snapId}/publicise`) {
      return true;
    }

    if (location.pathname === `/${snapId}/publicise/badges`) {
      return true;
    }

    if (location.pathname === `/${snapId}/publicise/cards`) {
      return true;
    }

    return false;
  };

  const defaultNavItems = [
    <div className="nav-list-separator">
      <hr />
    </div>,
    <SideNavigationText>
      <div
        className="p-side-navigation__item--title p-muted-heading"
        style={{ color: "#a8a8a8" }}
      >
        My snaps
      </div>
    </SideNavigationText>,
    ,
    {
      label: "Overview",
      href: "/snaps",
      icon: "pods",
      "aria-current": location.pathname === "/snaps",
    },
  ];

  let publisherNav: Array<
    | Element
    | {
        label: string;
        href: string;
        "aria-current"?: string;
        icon?: string;
      }
  > = [];

  if (snapId) {
    publisherNav = [
      {
        label: "Listing",
        href: `/${snapId}/listing`,
        "aria-current":
          location.pathname === `/${snapId}/listing` ? "true" : "false",
      },
      {
        label: "Builds",
        href: `/${snapId}/builds`,
        "aria-current":
          location.pathname === `/${snapId}/builds` ? "true" : "false",
      },
      {
        label: "Releases",
        href: `/${snapId}/releases`,
        "aria-current":
          location.pathname === `/${snapId}/releases` ? "true" : "false",
      },
      {
        label: "Metrics",
        href: `/${snapId}/metrics`,
        "aria-current":
          location.pathname === `/${snapId}/metrics` ? "true" : "false",
      },
      {
        label: "Publicise",
        href: `/${snapId}/publicise`,
        "aria-current": isPublicisePage() ? "true" : "false",
      },
      {
        label: "Settings",
        href: `/${snapId}/settings`,
        "aria-current":
          location.pathname === `/${snapId}/settings` ? "true" : "false",
      },
    ];
  }

  // @ts-ignore
  const mainNav = defaultNavItems.concat(publisherNav);

  return (
    <>
      <SideNavigation
        className="hide-collapsed"
        dark={true}
        items={[
          {
            items: mainNav,
          },
          {
            items: [
              <SideNavigationText>
                <div
                  className="p-side-navigation__item--title p-muted-heading"
                  style={{ color: "#a8a8a8" }}
                >
                  Validation sets
                </div>
              </SideNavigationText>,
              {
                label: "Overview",
                href: "/validation-sets",
                icon: "pods",
                "aria-current": location.pathname === "/validation-sets",
              },
            ],
          },
        ]}
      />

      {publisherData && publisherData.publisher && (
        <div className="p-side-navigation--icons is-dark">
          <div className="sidenav-bottom">
            <div className="nav-list-separator">
              <hr />
            </div>
            <ul className="p-side-navigation__list">
              <li className="p-side-navigation__item">
                <a href="/admin/account" className="p-side-navigation__link">
                  <i className="p-icon--user is-light p-side-navigation__icon"></i>
                  <span className="p-side-navigation__label">
                    {publisherData.publisher.fullname}
                  </span>
                </a>
              </li>
              <li className="p-side-navigation__item">
                <a href="/logout" className="p-side-navigation__link">
                  <i className="p-icon--begin-downloading is-light p-side-navigation__icon"></i>
                  <span className="p-side-navigation__label">Logout</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="sidenav-toggle-wrapper u-hide--small u-hide--medium">
        <button
          className="p-button--base has-icon is-dense sidenav-toggle is-dark u-no-margin l-navigation-collapse-toggle "
          aria-label={`${collapseNavigation ? "Collapse" : "Expand"} main navigation`}
          onClick={() => {
            setCollapseNavigation(!collapseNavigation);
          }}
        >
          <i className="p-icon--sidebar-toggle is-light"></i>
        </button>
      </div>
    </>
  );
}

export default PrimaryNav;
