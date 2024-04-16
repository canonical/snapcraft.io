import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRecoilState } from "recoil";
import { useParams, NavLink } from "react-router-dom";

import Logo from "./Logo";

import { publisherState } from "../../atoms";
import { brandStoresListSelector } from "../../selectors";
import { useBrand, usePublisher } from "../../hooks";

import type { Store } from "../../types/shared";

function Navigation({ sectionName }: { sectionName: string | null }) {
  const brandStoresList = useSelector(brandStoresListSelector);
  const { id } = useParams();
  const {
    isLoading: brandIsLoading,
    isSuccess: brandIsSuccess,
    data: brandData,
  } = useBrand(id);
  const { data: publisherData } = usePublisher();
  const [pinSideNavigation, setPinSideNavigation] = useState<boolean>(false);
  const [collapseNavigation, setCollapseNavigation] = useState<boolean>(false);
  const [showStoreSelector, setShowStoreSelector] = useState<boolean>(false);
  const [filteredBrandStores, setFilteredBrandstores] =
    useState<Array<Store>>(brandStoresList);
  const [publisher, setPublisher] = useRecoilState(publisherState);

  const getStoreName = (id: string | undefined) => {
    if (!id) {
      return;
    }

    const targetStore = brandStoresList.find((store) => store.id === id);

    if (targetStore) {
      return targetStore.name;
    }

    return;
  };

  useEffect(() => {
    setFilteredBrandstores(brandStoresList);
  }, [brandStoresList]);

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
              <div className="p-side-navigation--icons is-dark">
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
                </ul>
              </div>
              {publisherData &&
                publisherData?.publisher?.has_stores &&
                !brandIsLoading &&
                brandIsSuccess && (
                  <>
                    <div className="p-side-navigation--icons is-dark">
                      <ul className="p-side-navigation__list u-no-margin--bottom">
                        <li className="p-side-navigation__item--title p-muted-heading">
                          <span className="p-side-navigation__link">
                            <i className="p-icon--pods is-light p-side-navigation__icon"></i>
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
                              <div className="store-selector">
                                <button
                                  className="store-selector__button u-no-margin--bottom"
                                  onClick={() => {
                                    setShowStoreSelector(!showStoreSelector);
                                  }}
                                >
                                  {getStoreName(id)}
                                </button>
                                {showStoreSelector && (
                                  <div className="store-selector__panel">
                                    <div className="p-search-box u-no-margin--bottom">
                                      <label
                                        htmlFor="search-stores"
                                        className="u-off-screen"
                                      >
                                        Search stores
                                      </label>
                                      <input
                                        type="search"
                                        className="p-search-box__input"
                                        id="search-stores"
                                        name="search-stores"
                                        placeholder="Search"
                                        onInput={(e) => {
                                          const value = (
                                            e.target as HTMLInputElement
                                          ).value;

                                          if (value.length > 0) {
                                            setFilteredBrandstores(
                                              brandStoresList.filter(
                                                (store) => {
                                                  const storeName =
                                                    store.name.toLowerCase();
                                                  return storeName.includes(
                                                    value.toLowerCase()
                                                  );
                                                }
                                              )
                                            );
                                          } else {
                                            setFilteredBrandstores(
                                              brandStoresList
                                            );
                                          }
                                        }}
                                      />
                                      <button
                                        type="reset"
                                        className="p-search-box__reset"
                                      >
                                        <i className="p-icon--close">Close</i>
                                      </button>
                                      <button
                                        type="submit"
                                        className="p-search-box__button"
                                      >
                                        <i className="p-icon--search">Search</i>
                                      </button>
                                    </div>
                                    <ul className="store-selector__list">
                                      {filteredBrandStores.map(
                                        (store: Store) => (
                                          <li
                                            key={store.id}
                                            className="store-selector__item"
                                          >
                                            <NavLink
                                              to={`/admin/${store.id}/snaps`}
                                              onClick={() => {
                                                setShowStoreSelector(false);
                                              }}
                                            >
                                              {store.name}
                                            </NavLink>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </span>
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-side-navigation--icons is-dark">
                      <ul className="p-side-navigation__list">
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
                                    aria-selected={
                                      sectionName === "signing-keys"
                                    }
                                  >
                                    <i className="p-icon--security is-light p-side-navigation__icon"></i>
                                    <span className="p-side-navigation__label">
                                      Signing keys
                                    </span>
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
                    </div>
                  </>
                )}
              <div className="p-side-navigation--icons is-dark">
                {publisherData && publisherData.publisher && (
                  <ul className="p-side-navigation__list sidenav-bottom-ul">
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
                        <i className="p-icon--begin-downloading is-light p-side-navigation__icon"></i>
                        <span className="p-side-navigation__label">Logout</span>
                      </a>
                    </li>
                  </ul>
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
