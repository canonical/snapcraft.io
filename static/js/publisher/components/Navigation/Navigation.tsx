import { useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import { useAtom as useJotaiState, useAtomValue as useJotaiValue } from "jotai";
import { useParams, NavLink } from "react-router-dom";
import { Icon } from "@canonical/react-components";

import Logo from "./Logo";
import StoreSelector from "../StoreSelector";

import { publisherState } from "../../state/publisherState";
import { brandIdState } from "../../state/brandStoreState";
import { useBrand, usePublisher, useValidationSets } from "../../hooks";

import { brandStoresState } from "../../state/brandStoreState";

function Navigation({
  sectionName,
}: {
  sectionName: string | null;
}): React.JSX.Element {
  const brandStoresList = useJotaiValue(brandStoresState);
  const { id } = useParams();
  const { data: brand } = useBrand(id);
  const { data: publisherData } = usePublisher();
  const { data: validationSetsData } = useValidationSets();
  const [pinSideNavigation, setPinSideNavigation] = useState<boolean>(false);
  const [collapseNavigation, setCollapseNavigation] = useState<boolean>(false);
  const [publisher, setPublisher] = useRecoilState(publisherState);
  const [brandId, setBrandId] = useJotaiState(brandIdState);

  const currentStore = brandStoresList.find((store) => store.id === id);

  useEffect(() => {
    if (brand) {
      setBrandId(brand?.["account-id"]);
    } else {
      setBrandId("");
    }
  }, [brand]);

  useEffect(() => {
    if (publisherData) {
      setPublisher(publisherData.publisher);
    }
  }, [publisherData]);

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
                      <Icon
                        name="pods"
                        light
                        className="p-side-navigation__icon"
                      />
                      <span className="p-side-navigation__label">Overview</span>
                    </a>
                  </li>
                </ul>
                {validationSetsData && validationSetsData.length > 0 && (
                  <ul className="p-side-navigation__list">
                    <li className="p-side-navigation__item">
                      <a
                        href="/validation-sets"
                        className="p-side-navigation__link"
                      >
                        <Icon
                          name="topic"
                          light
                          className="p-side-navigation__icon"
                        />
                        <span className="p-side-navigation__label">
                          My validation sets
                        </span>
                      </a>
                    </li>
                  </ul>
                )}
              </div>
              {publisher?.has_stores && (
                <>
                  <div className="nav-list-separator">
                    <hr />
                  </div>
                  <div className="p-side-navigation--icons hide-collapsed is-dark">
                    <ul className="p-side-navigation__list u-no-margin--bottom">
                      <li className="p-side-navigation__item--title p-muted-heading">
                        <span className="p-side-navigation__link">
                          <i className="p-icon--units is-light p-side-navigation__icon"></i>
                          <span className="p-side-navigation__label">
                            My stores
                          </span>
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-side-navigation is-dark">
                    <ul className="p-side-navigation__list">
                      <li className="p-side-navigation__item">
                        <span className="p-side-navigation__link">
                          <span className="p-side-navigation__label">
                            <StoreSelector />
                          </span>
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-side-navigation--icons hide-collapsed is-dark">
                    <ul className="p-side-navigation__list">
                      {sectionName && id && (
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
                          {brandId && (
                            <>
                              <li className="p-tabs__item">
                                <NavLink
                                  to={`/admin/${id}/models`}
                                  className="p-side-navigation__link"
                                  aria-selected={sectionName === "models"}
                                >
                                  <i className="p-icon--models is-light p-side-navigation__icon"></i>
                                  <span className="p-side-navigation__label">
                                    Models
                                  </span>
                                </NavLink>
                              </li>
                              <li className="p-tabs__item">
                                <NavLink
                                  to={`/admin/${id}/signing-keys`}
                                  className="p-side-navigation__link"
                                  aria-selected={sectionName === "signing-keys"}
                                >
                                  <i className="p-icon--security is-light p-side-navigation__icon"></i>
                                  <span className="p-side-navigation__label">
                                    Signing keys
                                  </span>
                                </NavLink>
                              </li>
                            </>
                          )}
                          {currentStore &&
                            currentStore.roles &&
                            currentStore.roles.includes("admin") && (
                              <>
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
                        </>
                      )}
                    </ul>
                  </div>
                </>
              )}
              <div className="p-side-navigation--icons is-dark">
                {publisherData && publisherData.publisher && (
                  <div className="sidenav-bottom">
                    <div className="nav-list-separator">
                      <hr />
                    </div>
                    <ul className="p-side-navigation__list">
                      <li className="p-side-navigation__item">
                        <NavLink
                          to="/admin/account"
                          className="p-side-navigation__link"
                          aria-selected={sectionName === "account"}
                        >
                          <i className="p-icon--user is-light p-side-navigation__icon"></i>
                          <span className="p-side-navigation__label">
                            {publisherData.publisher.fullname}
                          </span>
                        </NavLink>
                      </li>
                      <li className="p-side-navigation__item">
                        <a href="/logout" className="p-side-navigation__link">
                          <i className="p-icon--log-out is-light p-side-navigation__icon"></i>
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
    </>
  );
}

export default Navigation;
