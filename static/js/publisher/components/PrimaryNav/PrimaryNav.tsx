import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import {
  SideNavigation,
  SideNavigationText,
} from "@canonical/react-components";

import StoreSelector from "../StoreSelector";

import { usePublisher, useValidationSets, useBrandStores } from "../../hooks";

import { brandStoresState } from "../../state/brandStoreState";

function PrimaryNav({
  collapseNavigation,
  setCollapseNavigation,
}: {
  collapseNavigation: boolean;
  setCollapseNavigation: (value: boolean) => void;
}): React.JSX.Element {
  const location = useLocation();
  const { data: publisherData } = usePublisher();
  const { data: validationSetsData } = useValidationSets();
  const { data: brandStoresList } = useBrandStores();

  const setRecoilBrandStores = useSetRecoilState(brandStoresState);

  useEffect(() => {
    if (brandStoresList) {
      setRecoilBrandStores(brandStoresList);
    }
  }, [brandStoresList]);

  return (
    <>
      <SideNavigation
        className="hide-collapsed"
        dark={true}
        items={[
          {
            items: [
              <div className="nav-list-separator" key="separator">
                <hr />
              </div>,
              <SideNavigationText key="unique-key">
                <div
                  className="p-side-navigation__item--title p-muted-heading"
                  style={{ color: "#a8a8a8" }}
                >
                  My snaps
                </div>
              </SideNavigationText>,
              {
                label: "Overview",
                href: "/snaps",
                icon: "pods",
                "aria-current": location.pathname === "/snaps",
              },
            ],
          },
          {
            items:
              validationSetsData && validationSetsData.length > 0
                ? [
                    {
                      label: "My validation sets",
                      href: "/validation-sets",
                      icon: "topic",
                      "aria-current":
                        location.pathname.includes("/validation-sets"),
                    },
                  ]
                : [],
          },
        ]}
      />

      {publisherData &&
        publisherData.publisher &&
        publisherData.publisher.has_stores && (
          <>
            <div className="nav-list-separator">
              <hr />
            </div>
            <div className="p-side-navigation--icons hide-collapsed is-dark">
              <ul className="p-side-navigation__list u-no-margin--bottom">
                <li className="p-side-navigation__item--title p-muted-heading">
                  <span className="p-side-navigation__link">
                    <i className="p-icon--units is-light p-side-navigation__icon"></i>
                    <span className="p-side-navigation__label">My stores</span>
                  </span>
                </li>
              </ul>
            </div>
            <div className="p-side-navigation is-dark">
              <ul className="p-side-navigation__list">
                <li className="p-side-navigation__item">
                  <span className="p-side-navigation__link">
                    <span className="p-side-navigation__label">
                      <StoreSelector nativeNavLink={true} />
                    </span>
                  </span>
                </li>
              </ul>
            </div>
          </>
        )}

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
                  <i className="p-icon--log-out is-light p-side-navigation__icon"></i>
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
