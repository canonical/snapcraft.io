import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { useSelector } from "react-redux";
import { AsyncThunkAction } from "@reduxjs/toolkit";
import { useAppDispatch } from "../../state/store";
import {
  Spinner,
  Row,
  Col,
  Button,
  Notification,
  Modal,
  Accordion,
} from "@canonical/react-components";

import { snapsSelector, membersSelector } from "../../state/selectors";
import { fetchSnaps } from "../../state/slices/snapsSlice";
import { fetchMembers } from "../../state/slices/membersSlice";

import { brandStoresState } from "../../state/brandStoreState";

import Publisher from "../Publisher";
import Reviewer from "../Reviewer";
import ReviewerAndPublisher from "../ReviewerAndPublisher";
import SnapsFilter from "./SnapsFilter";
import SnapsSearch from "./SnapsSearch";
import StoreNotFound from "../StoreNotFound";
import Navigation from "../../components/Navigation";
import PublishedSnapsTable from "./PublishedSnapsTable";
import IncludedSnapsTable from "./IncludedSnapsTable";

import { setPageTitle } from "../../utils";

import type {
  Store,
  Snap,
  SnapsList,
  Member,
  SnapsSlice,
  MembersSlice,
} from "../../types/shared";

function Snaps() {
  const brandStoresList = useRecoilValue(brandStoresState);
  const snaps = useSelector(snapsSelector);
  const members = useSelector(membersSelector);
  const snapsLoading = useSelector((state: SnapsSlice) => state.snaps.loading);
  const membersLoading = useSelector(
    (state: MembersSlice) => state.members.loading,
  );
  const snapsNotFound = useSelector(
    (state: SnapsSlice) => state.snaps.notFound,
  );
  const membersNotFound = useSelector(
    (state: MembersSlice) => state.members.notFound,
  );
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const [snapsInStore, setSnapsInStore] = useState<Snap[]>([]);
  const [otherStoreIds, setOtherStoreIds] = useState<string[]>([]);
  const [otherStores, setOtherStores] = useState<Store[]>([]);
  const [selectedSnaps, setSelectedSnaps] = useState<SnapsList>([]);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snapsToRemove, setSnapsToRemove] = useState<Snap[]>([]);
  const [showAddSuccessNotification, setShowAddSuccessNotification] =
    useState(false);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [showRemoveSuccessNotification, setShowRemoveSuccessNotification] =
    useState(false);
  const [removeSnapSaving, setRemoveSnapSaving] = useState(false);
  const [nonEssentialSnapIds, setNonEssentialSnapIds] = useState<string[]>([]);
  const [isReloading, setIsReloading] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isPublisherOnly, setIsPublisherOnly] = useState(false);
  const [isReviewerOnly, setIsReviewerOnly] = useState(false);
  const [isReviewerAndPublisherOnly, setIsReviewerAndPublisherOnly] =
    useState(false);
  const [showRemoveSnapsConfirmation, setShowRemoveSnapsConfirmation] =
    useState(false);
  const [globalStore, setGlobalStore] = useState<Store>();

  const [fetchSnapsByStoreIdPromise, setFetchSnapsByStoreIdPromise] = useState<
    ReturnType<AsyncThunkAction<Snap[], string, object>> | undefined
  >();

  const [fetchMembersByStoreIdPromise, setFetchMembersByStoreIdPromise] =
    useState<
      ReturnType<AsyncThunkAction<Member[], string, object>> | undefined
    >();

  const getStoreName = (storeId: string) => {
    const store = brandStoresList.find((item) => item.id === storeId);

    if (store) {
      return store.name;
    } else {
      return storeId;
    }
  };

  id ? setPageTitle(`Snaps in ${getStoreName(id)}`) : setPageTitle("Snaps");

  const addSnaps = () => {
    setIsSaving(true);

    const snapsToAdd = {
      add: selectedSnaps.map((item: Snap) => {
        return { name: item.name };
      }),
    };

    const snapsData = new FormData();
    snapsData.set("csrf_token", window.CSRF_TOKEN);
    snapsData.set("snaps", JSON.stringify(snapsToAdd));

    fetch(`/api/store/${id}/snaps`, {
      method: "POST",
      body: snapsData,
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw Error();
        }
      })
      .then((data) => {
        dispatch(fetchSnaps(id as string));

        // Add timeout so that the user has time to notice the save action
        // in the event of it happening very fast
        setTimeout(() => {
          setIsSaving(false);
          setSelectedSnaps([]);
          setSidePanelOpen(false);

          if (data.success) {
            setShowAddSuccessNotification(true);

            setTimeout(() => {
              setShowAddSuccessNotification(false);
            }, 5000);
          }

          if (data.error) {
            setShowErrorNotification(true);

            setTimeout(() => {
              setShowErrorNotification(false);
            }, 5000);
          }
        }, 1500);
      })
      .catch(() => {
        setIsSaving(false);
        setShowErrorNotification(true);

        setTimeout(() => {
          setShowErrorNotification(false);
        }, 5000);
      });
  };

  const removeSnaps = () => {
    setRemoveSnapSaving(true);

    const removingSnaps = {
      remove: snapsToRemove.map((item: Snap) => {
        return { name: item.name };
      }),
    };

    const snapsData = new FormData();
    snapsData.set("csrf_token", window.CSRF_TOKEN);
    snapsData.set("snaps", JSON.stringify(removingSnaps));

    fetch(`/api/store/${id}/snaps`, {
      method: "POST",
      body: snapsData,
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw Error();
        }
      })
      .then(() => {
        dispatch(fetchSnaps(id as string));

        // Add timeout so that the user has time to notice the save action
        // in the event of it happening very fast
        setTimeout(() => {
          setRemoveSnapSaving(false);
          setSnapsToRemove([]);
          setShowRemoveSuccessNotification(true);

          setTimeout(() => {
            setShowRemoveSuccessNotification(false);
          }, 5000);
        }, 1500);
      })
      .catch(() => {
        setRemoveSnapSaving(false);
      });
  };

  const isOnlyViewer = () =>
    currentMember?.roles.length === 1 && currentMember?.roles.includes("view");

  const getOtherStoreIds = () => {
    const storeIds: Array<string> = [];

    snaps.forEach((snap) => {
      if (!snap.store || snap.store === "ubuntu" || snap.store === id) {
        return;
      }

      if (!storeIds.includes(snap.store)) {
        storeIds.push(snap.store);
      }

      if (snap?.["other-stores"]?.length) {
        snap["other-stores"].forEach((otherStoreId) => {
          if (otherStoreId !== id && !storeIds.includes(otherStoreId)) {
            storeIds.push(otherStoreId);
          }
        });
      }
    });

    return storeIds;
  };

  const includedStores = snaps
    .filter(
      (snap) => snap["included-stores"] && snap["included-stores"].length > 0,
    )
    .map((snap) => ({
      id: snap.id,
      name: snap.name,
      userHasAccess: snap.userHasAccess,
      includedStore: snap["included-stores"][0],
    }));

  useEffect(() => {
    setSnapsInStore([]);
    setOtherStores([]);
    setIsReloading(true);

    if (fetchSnapsByStoreIdPromise) {
      fetchSnapsByStoreIdPromise?.abort();
    }

    dispatch(fetchSnaps(id as string));

    const fetchSnapsPromise = dispatch(fetchSnaps(id as string));
    setFetchSnapsByStoreIdPromise(fetchSnapsPromise);

    if (fetchMembersByStoreIdPromise) {
      fetchMembersByStoreIdPromise?.abort();
    }

    dispatch(fetchMembers(id as string));

    const fetchMembersPromise = dispatch(fetchMembers(id as string));
    setFetchMembersByStoreIdPromise(fetchMembersPromise);
  }, [id]);

  useEffect(() => {
    setSnapsInStore(snaps.filter((snap) => snap.store === id));
    setOtherStoreIds(getOtherStoreIds());

    const nonEssentialSnaps = snaps.filter((item: Snap) => {
      return item.store !== id && !item.essential;
    });

    setNonEssentialSnapIds(nonEssentialSnaps.map((item) => item.id));

    if (snaps.length) {
      setIsReloading(false);
    }
  }, [snaps]);

  useEffect(() => {
    setGlobalStore({
      id: "ubuntu",
      name: "Global",
      snaps: snaps.filter((snap) => snap.store === "ubuntu"),
    });

    setOtherStores(
      otherStoreIds.map((storeId: string) => {
        return {
          id: storeId,
          name: getStoreName(storeId),
          snaps: snaps.filter((snap) => {
            if (storeId === "ubuntu") {
              return false;
            }

            if (snap.store === storeId) {
              return true;
            }

            if (
              snap["other-stores"] &&
              snap["other-stores"].includes(storeId)
            ) {
              return true;
            }

            return false;
          }),
        };
      }),
    );
  }, [otherStoreIds]);

  useEffect(() => {
    const currentMember = members.find((member) => member.current_user) ?? null;
    setCurrentMember(currentMember);
  }, [snaps, members, snapsLoading, membersLoading]);

  useEffect(() => {
    const store = brandStoresList.find((store) => store.id === id);
    setCurrentStore(store || null);
  }, [brandStoresList, id]);

  useEffect(() => {
    if (currentStore) {
      const roles = currentStore.roles;

      if (roles) {
        setIsPublisherOnly(roles.length === 1 && roles.includes("access"));
        setIsReviewerOnly(roles.length === 1 && roles.includes("review"));
        setIsReviewerAndPublisherOnly(
          roles.length === 2 &&
            roles.includes("access") &&
            roles.includes("review"),
        );
      } else {
        setIsPublisherOnly(false);
        setIsReviewerOnly(false);
        setIsReviewerAndPublisherOnly(false);
      }
    } else {
      setIsPublisherOnly(false);
      setIsReviewerOnly(false);
      setIsReviewerAndPublisherOnly(false);
    }
  }, [currentStore, id]);

  const getSectionName = () => {
    if (!isReloading && !isOnlyViewer() && !snapsNotFound && !membersNotFound) {
      return "snaps";
    } else {
      return null;
    }
  };

  return (
    <div className="l-application" role="presentation">
      <Navigation sectionName={getSectionName()} />
      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__content">
            {snapsLoading && membersLoading ? (
              <div className="u-fixed-width">
                <Spinner text="Loading&hellip;" />
              </div>
            ) : currentStore && isReviewerAndPublisherOnly ? (
              <ReviewerAndPublisher />
            ) : currentStore && isReviewerOnly ? (
              <Reviewer />
            ) : currentStore && isPublisherOnly ? (
              <Publisher />
            ) : snapsNotFound ? (
              <StoreNotFound />
            ) : (
              <>
                {!isReloading && (
                  <>
                    <div className="u-fixed-width">
                      <h1 className="p-heading--4">
                        {getStoreName(id || "")} / Store snaps
                      </h1>
                    </div>
                    <Row>
                      <Col size={8}>
                        <SnapsFilter
                          setSnapsInStore={setSnapsInStore}
                          snapsInStore={snapsInStore}
                          setOtherStores={setOtherStores}
                          otherStoreIds={otherStoreIds}
                          getStoreName={getStoreName}
                          snaps={snaps}
                          id={id || ""}
                        />
                      </Col>
                    </Row>
                  </>
                )}
                <div className="u-fixed-width">
                  {isReloading && <Spinner text="Loading&hellip;" />}

                  {!isReloading && currentStore && (
                    <>
                      <Accordion
                        className="brand-store-accordion"
                        sections={[
                          {
                            key: "published-snaps",
                            title:
                              currentStore && currentStore.name
                                ? `Snaps published in ${currentStore.name}`
                                : "Published snaps",
                            content: (
                              <PublishedSnapsTable
                                snapsInStore={snapsInStore}
                              />
                            ),
                          },
                        ]}
                        expanded="published-snaps"
                      />
                      <hr className="u-no-margin--bottom" />
                      <div className="accordion-actions">
                        {!isOnlyViewer() && (
                          <div className="accordion-actions__row u-align--right">
                            <Button
                              disabled={
                                snapsToRemove.length < 1 || removeSnapSaving
                              }
                              onClick={() => {
                                setShowRemoveSnapsConfirmation(true);
                              }}
                              className={
                                removeSnapSaving
                                  ? "has-icon is-dense"
                                  : "is-dense"
                              }
                            >
                              {removeSnapSaving ? (
                                <>
                                  <i className="p-icon--spinner u-animation--spin"></i>
                                  <span>Saving...</span>
                                </>
                              ) : snapsToRemove.length > 1 ? (
                                "Exclude snaps"
                              ) : (
                                "Exclude snap"
                              )}
                            </Button>
                            <Button
                              onClick={() => setSidePanelOpen(true)}
                              appearance="positive"
                              className="u-no-margin--right is-dense"
                            >
                              Include snap
                            </Button>
                          </div>
                        )}
                        <Accordion
                          className="brand-store-accordion"
                          sections={[
                            {
                              key: "included-snaps",
                              title: "Included snaps",
                              content: (
                                <IncludedSnapsTable
                                  otherStores={otherStores}
                                  globalStore={globalStore || null}
                                  getStoreName={getStoreName}
                                  isOnlyViewer={isOnlyViewer}
                                  snapsToRemove={snapsToRemove}
                                  setSnapsToRemove={setSnapsToRemove}
                                  nonEssentialSnapIds={nonEssentialSnapIds}
                                />
                              ),
                            },
                          ]}
                          expanded="included-snaps"
                        />
                      </div>
                      {!!includedStores.length && !isReloading && (
                        <>
                          <hr className="u-no-margin--bottom" />
                          <Accordion
                            className="brand-store-accordion"
                            sections={[
                              {
                                key: "included-stores",
                                title: `Fully included stores (${includedStores.length})`,
                                content: (
                                  <div className="u-fixed-width">
                                    <h4>Fully included stores</h4>
                                    <p>
                                      In addition to the snaps listed above, all
                                      snaps from the following stores are also
                                      included in {getStoreName(id || "")}.
                                    </p>
                                    <ul>
                                      {includedStores.map((store) => (
                                        <li key={store.id}>
                                          {store.userHasAccess ? (
                                            <Link
                                              to={`/admin/${store.id}/snaps`}
                                            >
                                              {store.name}
                                            </Link>
                                          ) : (
                                            <>
                                              {store.name} ({store.id})
                                            </>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ),
                              },
                            ]}
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <div
        className={`l-aside__overlay ${sidePanelOpen ? "" : "u-hide"}`}
        onClick={() => {
          setSidePanelOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key == "Enter" || e.key == " ") {
            setSidePanelOpen(false);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close side panel"
      ></div>
      <aside
        className={`l-aside ${sidePanelOpen ? "" : "is-collapsed"}`}
        id="aside-panel"
      >
        <div className="p-panel is-flex-column">
          <div className="p-panel__header">
            <h4 className="p-panel__title">
              Add a snap to {getStoreName(id || "")}
            </h4>
          </div>
          <div className="p-panel__content u-no-padding--top">
            <div className="u-fixed-width">
              <SnapsSearch
                selectedSnaps={selectedSnaps}
                setSelectedSnaps={setSelectedSnaps}
                storeId={id || ""}
                nonEssentialSnapIds={nonEssentialSnapIds}
              />
            </div>
          </div>
          <div className="p-panel__footer u-align--right">
            <div className="u-fixed-width">
              <Button
                onClick={() => {
                  setSidePanelOpen(false);
                  setSelectedSnaps([]);
                }}
              >
                Cancel
              </Button>

              <Button
                appearance="positive"
                disabled={selectedSnaps.length < 1 || isSaving}
                onClick={(e) => {
                  e.preventDefault();
                  addSnaps();
                }}
                className={`u-no-margin--right ${
                  isSaving ? "has-icon is-dark" : ""
                }`}
              >
                {isSaving ? (
                  <>
                    <i className="p-icon--spinner is-light u-animation--spin"></i>
                    <span>Saving...</span>
                  </>
                ) : selectedSnaps.length <= 1 ? (
                  "Add snap"
                ) : (
                  "Add snaps"
                )}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="p-notification-center">
        {showAddSuccessNotification && (
          <Notification
            severity="positive"
            onDismiss={() => setShowAddSuccessNotification(false)}
          >
            Snaps have been added to store
          </Notification>
        )}

        {showRemoveSuccessNotification && (
          <Notification
            severity="positive"
            onDismiss={() => setShowRemoveSuccessNotification(false)}
          >
            Snaps have been removed from store
          </Notification>
        )}

        {showErrorNotification && (
          <Notification
            severity="negative"
            onDismiss={() => setShowErrorNotification(false)}
          >
            Something went wrong.{" "}
            <a href="https://github.com/canonical-web-and-design/snapcraft.io/issues/new">
              Report a bug
            </a>
          </Notification>
        )}
      </div>

      {showRemoveSnapsConfirmation && (
        <Modal
          close={() => {
            setShowRemoveSnapsConfirmation(false);
          }}
          title={`Exclude ${
            snapsToRemove.length > 1 ? "snaps" : snapsToRemove[0].name
          }`}
          buttonRow={
            <>
              <Button
                className="u-no-margin--bottom"
                onClick={() => {
                  setShowRemoveSnapsConfirmation(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="u-no-margin--bottom u-no-margin--right"
                appearance="positive"
                onClick={() => {
                  setShowRemoveSnapsConfirmation(false);
                  removeSnaps();
                }}
              >
                Exclude snap{snapsToRemove.length > 1 ? "s" : ""}
              </Button>
            </>
          }
        >
          {snapsToRemove.length > 1 && (
            <ul>
              {snapsToRemove.map((snapToRemove: Snap) => (
                <li key={snapToRemove.id}>
                  <strong>{snapToRemove.name}</strong>
                </li>
              ))}
            </ul>
          )}
          <p>
            {snapsToRemove.length > 1 ? "These snaps" : "This snap"} can still
            be included again in this store.
          </p>
        </Modal>
      )}
    </div>
  );
}

export default Snaps;
