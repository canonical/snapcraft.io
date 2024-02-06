import React, { useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { brandStoresListSelector } from "../../selectors";

import type { Store } from "../../types/shared";

function Navigation() {
  const brandStoresList = useSelector(brandStoresListSelector);
  const [collapsed, setCollapsedState] = useState(true);
  const hideSideNav = (hide: boolean) => {
    setCollapsedState(hide);

    if (hide) {
      (document.activeElement as HTMLElement).blur();
    }
  };

  // Feature flag for new snaps table layout
  const [searchParams] = useSearchParams();
  const showNewTables = searchParams.get("showNewTables");

  return (
    <>
      <div className="l-navigation-bar">
        <div className="p-panel">
          <div className="p-panel__header">
            <div className="p-panel__controls">
              <button
                className="p-side-navigation__toggle--dense"
                onClick={() => hideSideNav(false)}
              >
                <i className="p-icon--right-chevrons"></i>
              </button>
              &emsp;Open side navigation
            </div>
          </div>
        </div>
      </div>
      <header className={`l-navigation ${collapsed ? "is-collapsed" : ""}`}>
        <div className="l-navigation__drawer">
          <div className="p-panel is-flex-column--medium">
            <div className="p-panel__header is-sticky">
              <span className="p-panel__logo">
                <i className="p-panel__logo-icon p-icon--snapcraft-cube" />
                <h2 className="p-heading--5 p-panel__logo-name is-fading-when-collapsed">
                  My stores
                </h2>
              </span>
              <div className="p-panel__controls u-hide--large">
                <button
                  onClick={() => hideSideNav(true)}
                  className="p-side-navigation__toggle--dense has-icon u-no-margin u-hide--medium"
                >
                  <i className="p-icon--left-chevrons">Close side navigation</i>
                </button>
              </div>
            </div>

            <div className="p-panel__content">
              <div className="p-side-navigation">
                <nav aria-label="Stores navigation">
                  <ul className="p-side-navigation__list">
                    {brandStoresList.map((item: Store) => {
                      return item.id && item.name ? (
                        <li className="p-side-navigation__item" key={item.id}>
                          <NavLink
                            className="p-side-navigation__link"
                            to={`/admin/${item.id}/snaps${
                              showNewTables ? "?showNewTables=true" : ""
                            }`}
                          >
                            <span className="p-side-navigation__label u-truncate">
                              {item.name}
                            </span>
                          </NavLink>
                        </li>
                      ) : (
                        ""
                      );
                    })}
                  </ul>
                </nav>
              </div>
            </div>

            <div className="p-panel__footer u-hide--small u-hide--large">
              {collapsed ? (
                <button
                  onClick={() => hideSideNav(false)}
                  className="p-side-navigation__toggle--dense has-icon u-no-margin"
                >
                  <i className="p-icon--right-chevrons">Open side navigation</i>
                </button>
              ) : (
                <button
                  onClick={() => hideSideNav(true)}
                  className="p-side-navigation__toggle--dense has-icon u-no-margin"
                >
                  <i className="p-icon--left-chevrons">Close side navigation</i>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navigation;
