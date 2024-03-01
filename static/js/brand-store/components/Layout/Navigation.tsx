import React, { useState } from "react";
import Logo from "./Logo";

function Navigation() {
  const [pinSideNavigation, setPinSideNavigation] = useState<boolean>(false);
  const [collapseNavigation, setCollapseNavigation] = useState<boolean>(false);
  return (
    <>
      <header className="l-navigation-bar">
        <div className="p-panel is-dark">
          <div className="p-panel__header">
            <Logo />
            <div className="p-panel__controls">
              <button
                className="p-panel__toggle u-no-margin--bottom"
                onClick={() => {
                  setCollapseNavigation(!collapseNavigation);
                }}
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      </header>
      <nav
        className={`l-navigation ${!collapseNavigation ? "is-collapsed" : ""} ${pinSideNavigation ? "is-pinned" : ""}`}
      >
        <div className="l-navigation__drawer">
          <div className="p-panel is-dark">
            <div className="p-panel__header is-sticky">
              <Logo />
              <div className="p-panel__controls">
                {pinSideNavigation && (
                  <button
                    className="p-button--base is-dark has-icon u-no-margin u-hide--small u-hide--large"
                    onClick={() => {
                      setPinSideNavigation(false);
                    }}
                  >
                    <i className="is-light p-icon--close"></i>
                  </button>
                )}

                {!pinSideNavigation && (
                  <button
                    className="p-button--base is-dark has-icon u-no-margin u-hide--small u-hide--large"
                    onClick={() => {
                      setPinSideNavigation(true);
                    }}
                  >
                    <i className="is-light p-icon--pin"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="p-panel__content">
              <div className="p-side-navigation--icons is-dark">
                <ul className="p-side-navigation__list sidenav-top-ul">
                  <li className="p-side-navigation__item--title">
                    <span className="p-side-navigation__link">
                      <span className="p-side-navigation__label">
                        My stores
                      </span>
                    </span>
                  </li>
                  <li className="p-side-navigation__item">
                    <span className="p-side-navigation__link">
                      <span className="p-side-navigation__label">
                        <select></select>
                      </span>
                    </span>
                  </li>
                  <li className="p-side-navigation__item">
                    <a className="p-side-navigation__link" href="/">
                      <i className="p-icon--pods is-light p-side-navigation__icon"></i>
                      <span className="p-side-navigation__label">
                        Store snaps
                      </span>
                    </a>
                  </li>
                  <li className="p-side-navigation__item">
                    <a className="p-side-navigation__link" href="/">
                      <i className="p-icon--user-group is-light p-side-navigation__icon"></i>
                      <span className="p-side-navigation__label">Members</span>
                    </a>
                  </li>
                  <li className="p-side-navigation__item">
                    <a className="p-side-navigation__link" href="/">
                      <i className="p-icon--settings is-light p-side-navigation__icon"></i>
                      <span className="p-side-navigation__label">Settings</span>
                    </a>
                  </li>
                </ul>
                <ul className="p-side-navigation__list sidenav-bottom-ul">
                  <li className="p-side-navigation__item">
                    <a href="/" className="p-side-navigation__link">
                      <i className="p-icon--user is-light p-side-navigation__icon"></i>
                      <span className="p-side-navigation__label">Username</span>
                    </a>
                  </li>
                  <li className="p-side-navigation__item">
                    <a href="/" className="p-side-navigation__link">
                      <i className="p-icon--begin-downloading is-light p-side-navigation__icon"></i>
                      <span className="p-side-navigation__label">Logout</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navigation;
