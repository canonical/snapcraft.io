import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import Logo from "./Logo";

import { brandStoresListSelector } from "../../selectors";

import type { Store } from "../../types/shared";

function Navigation({ sectionName }: { sectionName: string | null }) {
  const brandStoresList = useSelector(brandStoresListSelector);
  const { id } = useParams();
  const navigate = useNavigate();
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
                        <select
                          value={id}
                          onChange={(e) => {
                            navigate(`/admin/${e.target.value}/snaps`);
                          }}
                        >
                          {brandStoresList.map((store: Store) => (
                            <option key={store.id} value={store.id}>
                              {store.name}
                            </option>
                          ))}
                        </select>
                      </span>
                    </span>
                  </li>
                  {sectionName && (
                    <>
                      <li className="p-side-navigation__item">
                        <a
                          className={`p-side-navigation__link ${sectionName === "snaps" ? "is-active" : ""}`}
                          href={`/admin/${id}/snaps`}
                        >
                          <i className="p-icon--pods is-light p-side-navigation__icon"></i>
                          <span className="p-side-navigation__label">
                            Store snaps
                          </span>
                        </a>
                      </li>
                      <li className="p-side-navigation__item">
                        <a
                          className={`p-side-navigation__link ${sectionName === "members" ? "is-active" : ""}`}
                          href={`/admin/${id}/members`}
                        >
                          <i className="p-icon--user-group is-light p-side-navigation__icon"></i>
                          <span className="p-side-navigation__label">
                            Members
                          </span>
                        </a>
                      </li>
                      <li className="p-side-navigation__item">
                        <a
                          className={`p-side-navigation__link ${sectionName === "settings" ? "is-active" : ""}`}
                          href={`/admin/${id}/settings`}
                        >
                          <i className="p-icon--settings is-light p-side-navigation__icon"></i>
                          <span className="p-side-navigation__label">
                            Settings
                          </span>
                        </a>
                      </li>
                    </>
                  )}
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
