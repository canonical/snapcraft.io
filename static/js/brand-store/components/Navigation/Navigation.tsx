import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate, NavLink } from "react-router-dom";

import Logo from "./Logo";

import { brandStoresListSelector } from "../../selectors";
import { useBrand, usePublisher } from "../../hooks";

import type { Store } from "../../types/shared";

function Navigation({ sectionName }: { sectionName: string | null }) {
  const brandStoresList = useSelector(brandStoresListSelector);
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    isLoading: brandIsLoading,
    isSuccess: brandIsSuccess,
    data: brandData,
  } = useBrand(id);
  const { data: publisherData } = usePublisher();
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
                {!brandIsLoading && brandIsSuccess && (
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
                          <NavLink
                            className="p-side-navigation__link"
                            to={`/admin/${id}/snaps`}
                            aria-selected={sectionName === "snaps"}
                          >
                            <i className="p-icon--pods is-light p-side-navigation__icon"></i>
                            <span className="p-side-navigation__label">
                              Store snaps
                            </span>
                          </NavLink>
                        </li>
                        {/* If success then models and signing keys are available */}
                        {brandData.success && !brandData.data?.Code && (
                          <>
                            <li className="p-tabs__item">
                              <NavLink
                                to={`/admin/${id}/models`}
                                className="p-side-navigation__link"
                                aria-selected={sectionName === "models"}
                              >
                                <div className="p-side-navigation__label">
                                  Models
                                </div>
                              </NavLink>
                            </li>
                            <li className="p-tabs__item">
                              <NavLink
                                to={`/admin/${id}/signing-keys`}
                                className="p-side-navigation__link"
                                aria-selected={sectionName === "signing-keys"}
                              >
                                <div className="p-side-navigation__label">
                                  Signing keys
                                </div>
                              </NavLink>
                            </li>
                          </>
                        )}
                        <li className="p-side-navigation__item">
                          <NavLink
                            className="p-side-navigation__link"
                            to={`/admin/${id}/members`}
                            aria-selected={sectionName === "members"}
                          >
                            <i className="p-icon--user-group is-light p-side-navigation__icon"></i>
                            <span className="p-side-navigation__label">
                              Members
                            </span>
                          </NavLink>
                        </li>
                        <li className="p-side-navigation__item">
                          <NavLink
                            className="p-side-navigation__link"
                            to={`/admin/${id}/settings`}
                            aria-selected={sectionName === "settings"}
                          >
                            <i className="p-icon--settings is-light p-side-navigation__icon"></i>
                            <span className="p-side-navigation__label">
                              Settings
                            </span>
                          </NavLink>
                        </li>
                      </>
                    )}
                  </ul>
                )}
                {publisherData && publisherData.publisher && (
                  <ul className="p-side-navigation__list sidenav-bottom-ul">
                    <li className="p-side-navigation__item">
                      <a
                        href="/account/details"
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
                        <span className="p-side-navigation__label">Logout</span>
                      </a>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navigation;
