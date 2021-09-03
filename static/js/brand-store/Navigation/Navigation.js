import React, { useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { brandStoresListSelector } from "../selectors";

function Navigation() {
  const brandStoresList = useSelector(brandStoresListSelector);
  const [collapsed, setCollapsedState] = useState(true);
  const openSideNavButton = useRef(null);
  const hideSideNav = (hide) => {
    setCollapsedState(hide);

    if (hide) {
      openSideNavButton.current.focus();
    }
  };

  return (
    <>
      <div className="l-navigation-bar">
        <div className="p-panel">
          <div className="p-panel__header">
            <div className="p-panel__controls">
              <button
                className="p-panel__toggle"
                onClick={() => hideSideNav(false)}
                ref={openSideNavButton}
              >
                Open side navigation
              </button>
            </div>
          </div>
        </div>
      </div>
      <header className={`l-navigation ${collapsed ? "is-collapsed" : ""}`}>
        <div className="l-navigation__drawer">
          <div className="p-panel">
            <div className="p-panel__header is-sticky">
              <span className="p-panel__logo">
                <i
                  className="p-panel__logo-icon p-icon--snapcraft-cube"
                  width="24"
                  height="24"
                />
                <h2 className="p-heading--5 p-panel__logo-name is-fading-when-collapsed">
                  My stores
                </h2>
              </span>
              <div className="p-panel__controls u-hide--large">
                <button
                  onClick={() => hideSideNav(true)}
                  className="p-button--base has-icon u-no-margin u-hide--medium"
                >
                  <i className="p-icon--close"></i>
                </button>
                <button
                  onClick={() => hideSideNav(true)}
                  className="p-button--base has-icon u-no-margin u-hide--small"
                >
                  <i className="p-icon--close p-icon--pin"></i>
                </button>
              </div>
            </div>

            <div className="p-panel__content">
              <div className="p-side-navigation--icons">
                <nav aria-label="Stores navigation">
                  <ul className="p-side-navigation__list">
                    {brandStoresList.map((item) => (
                      <li className="p-side-navigation__item" key={item.id}>
                        <NavLink
                          activeClassName="is-active"
                          className="p-side-navigation__link"
                          to={`/admin/${item.id}/snaps`}
                        >
                          <i className="p-side-navigation__icon p-icon--initial">
                            <span>{item.name.charAt(0)}</span>
                          </i>
                          <span className="p-side-navigation__label u-truncate">
                            {item.name}
                          </span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Navigation;
