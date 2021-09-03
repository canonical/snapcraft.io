import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { brandStoresListSelector } from "../selectors";

function Navigation() {
  const brandStoresList = useSelector(brandStoresListSelector);

  return (
    <>
      <div className="l-navigation-bar">
        <div className="p-panel is-dark is-jaas-background">
          <div className="p-panel__header">
            {/* <a className="p-panel__logo" href="#">
              <img
                className="p-panel__logo-icon"
                src="https://assets.ubuntu.com/v1/7144ec6d-logo-jaas-icon.svg"
                alt=""
                width="24"
                height="24"
              />
              <img
                className="p-panel__logo-name is-fading-when-collapsed"
                src="https://assets.ubuntu.com/v1/2e04d794-logo-jaas.svg"
                alt="JAAS"
                height="16"
              />
            </a>
            <div className="p-panel__controls">
              <span className="p-panel__toggle js-menu-toggle">Menu</span>
            </div> */}
          </div>
        </div>
      </div>
      <header className="l-navigation">
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
                <button className="p-button--base has-icon u-no-margin u-hide--medium js-menu-close">
                  <i className="p-icon--close"></i>
                </button>
                <button className="p-button--base has-icon u-no-margin u-hide--small js-menu-pin">
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
