import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Row, Col } from "@canonical/react-components";

import Logo from "../../brand-store/components/Navigation/Logo";

import { usePublisher } from "../../brand-store/hooks";

function Root(): JSX.Element {
  const { data: publisherData } = usePublisher();
  const [pinSideNavigation, setPinSideNavigation] = useState<boolean>(false);
  const [collapseNavigation, setCollapseNavigation] = useState<boolean>(false);

  return (
    <div className="l-application">
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
        className={`l-navigation ${collapseNavigation ? "is-collapsed" : ""} ${pinSideNavigation ? "is-pinned" : ""}`}
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
              <div className="nav-list-separator">
                <hr />
              </div>
              <div className="p-side-navigation--icons hide-collapsed is-dark">
                <ul className="p-side-navigation__list">
                  <li className="p-side-navigation__item--title p-muted-heading">
                    <span className="p-side-navigation__link">
                      <span className="p-side-navigation__label">My snaps</span>
                    </span>
                  </li>
                  <li className="p-side-navigation__item">
                    <a className="p-side-navigation__link" href="/snaps">
                      <i className="p-icon--pods is-light p-side-navigation__icon"></i>
                      <span className="p-side-navigation__label">Overview</span>
                    </a>
                  </li>
                  <li className="p-side-navigation__item">
                    <a
                      className="p-side-navigation__link"
                      href="/validation-sets"
                      aria-current="page"
                    >
                      <i className="p-icon--pods is-light p-side-navigation__icon"></i>
                      <span className="p-side-navigation__label">
                        My validation sets
                      </span>
                    </a>
                  </li>
                </ul>
              </div>
              <div className="p-side-navigation--icons is-dark">
                {publisherData && publisherData.publisher && (
                  <div className="sidenav-bottom">
                    <div className="nav-list-separator">
                      <hr />
                    </div>
                    <ul className="p-side-navigation__list">
                      <li className="p-side-navigation__item">
                        <a
                          href="/admin/account"
                          className="p-side-navigation__link"
                        >
                          <i className="p-icon--user is-light p-side-navigation__icon"></i>
                          <span className="p-side-navigation__label">
                            {publisherData.publisher.fullname}
                          </span>
                        </a>
                      </li>
                      <li className="p-side-navigation__item">
                        <a href="/logout" className="p-side-navigation__link">
                          <i className="p-icon--begin-downloading is-light p-side-navigation__icon"></i>
                          <span className="p-side-navigation__label">
                            Logout
                          </span>
                        </a>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="sidenav-toggle-wrapper u-hide--small u-hide--medium">
              <button
                className="p-button--base has-icon is-dense sidenav-toggle is-dark u-no-margin l-navigation-collapse-toggle u-hide--small"
                aria-label={`${collapseNavigation ? "Collapse" : "Expand"} main navigation`}
                onClick={() => {
                  setCollapseNavigation(!collapseNavigation);
                }}
              >
                <i className="p-icon--sidebar-toggle is-light"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__content">
            <Row>
              <Col size={12}>
                <Outlet />
              </Col>
            </Row>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Root;
