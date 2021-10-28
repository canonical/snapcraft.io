import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Spinner,
  Row,
  Col,
  Button,
  Notification,
} from "@canonical/react-components";

import {
  snapsSelector,
  brandStoresListSelector,
  membersSelector,
} from "../selectors";
import { fetchSnaps } from "../slices/snapsSlice";
import { fetchMembers } from "../slices/membersSlice";

import SnapsTable from "./SnapsTable";
import SnapsFilter from "./SnapsFilter";
import SnapsSearch from "./SnapsSearch";
import SectionNav from "../SectionNav";

function Snaps() {
  const brandStoresList = useSelector(brandStoresListSelector);
  const snaps = useSelector(snapsSelector);
  const members = useSelector(membersSelector);
  const snapsLoading = useSelector((state) => state.snaps.loading);
  const storesLoading = useSelector((state) => state.brandStores.loading);
  const membersLoading = useSelector((state) => state.members.loading);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [snapsInStore, setSnapsInStore] = useState([]);
  const [otherStoreIds, setOtherStoreIds] = useState([]);
  const [otherStores, setOtherStores] = useState([]);
  const [selectedSnaps, setSelectedSnaps] = useState([]);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snapsToRemove, setSnapsToRemove] = useState([]);
  const [showAddSuccessNotification, setShowAddSuccessNotification] = useState(
    false
  );
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [
    showRemoveSuccessNotification,
    setShowRemoveSuccessNotification,
  ] = useState(false);
  const [removeSnapSaving, setRemoveSnapSaving] = useState(false);
  const [nonEssentialSnapIds, setNonEssentialSnapIds] = useState([]);
  const [isReloading, setIsReloading] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);
  let location = useLocation();

  const getStoreName = (storeId) => {
    const store = brandStoresList.find((item) => item.id === storeId);

    if (store) {
      return store.name;
    } else {
      return storeId;
    }
  };

  const addSnaps = (e) => {
    e.preventDefault();

    setIsSaving(true);

    const snapsToAdd = {
      add: selectedSnaps.map((item) => {
        return { name: item.name };
      }),
    };

    const snapsData = new FormData();
    snapsData.set("csrf_token", window.CSRF_TOKEN);
    snapsData.set("snaps", JSON.stringify(snapsToAdd));

    fetch(`/admin/store/${id}/snaps`, {
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
        dispatch(fetchSnaps(id));

        // Add timeout so that the user has time to notice the save action
        // in the event of it happening very fast
        setTimeout(() => {
          setIsSaving(false);
          setSelectedSnaps([]);
          setSidePanelOpen(false);

          if (data.success) {
            setShowAddSuccessNotification(true);
          }

          if (data.error) {
            setShowErrorNotification(true);
          }
        }, 1500);
      })
      .catch(() => {
        setIsSaving(false);
        setShowErrorNotification(true);
      });
  };

  const removeSnaps = (e) => {
    e.preventDefault();

    setRemoveSnapSaving(true);

    const removingSnaps = {
      remove: snapsToRemove.map((item) => {
        return { name: item.name };
      }),
    };

    const snapsData = new FormData();
    snapsData.set("csrf_token", window.CSRF_TOKEN);
    snapsData.set("snaps", JSON.stringify(removingSnaps));

    fetch(`/admin/store/${id}/snaps`, {
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
        dispatch(fetchSnaps(id));

        // Add timeout so that the user has time to notice the save action
        // in the event of it happening very fast
        setTimeout(() => {
          setRemoveSnapSaving(false);
          setSnapsToRemove([]);
          setShowRemoveSuccessNotification(true);
        }, 1500);
      })
      .catch(() => {
        setRemoveSnapSaving(false);
      });
  };

  const isAdmin = () => currentMember.roles.includes("admin");

  useEffect(() => {
    dispatch(fetchMembers(id));
    dispatch(fetchSnaps(id));
  }, [id]);

  useEffect(() => {
    setSnapsInStore(snaps.filter((snap) => snap.store === id));

    setOtherStoreIds(
      Array.from(
        new Set(
          snaps
            .filter((snap) => snap.store !== id)
            .map((snap) => {
              return snap.store;
            })
        )
      )
    );

    const nonEssentialSnaps = snaps.filter((item) => {
      return item.store !== id && !item.essential;
    });

    setNonEssentialSnapIds(nonEssentialSnaps.map((item) => item.id));

    if (snaps.length) {
      setIsReloading(false);
    }
  }, [snaps]);

  useEffect(() => {
    setOtherStores(
      otherStoreIds.map((storeId) => {
        return {
          id: storeId,
          name: getStoreName(storeId),
          snaps: snaps.filter((snap) => snap.store === storeId),
        };
      })
    );
  }, [otherStoreIds]);

  useEffect(() => {
    // protect against hash changes e.g. mobile navigation
    if (location.pathname !== `/admin/${id}/snaps`) {
      setSnapsInStore([]);
      setOtherStores([]);
      setIsReloading(true);
    }
  }, [location]);

  useEffect(() => {
    setCurrentMember(members.find((member) => member.current_user));
  }, [snaps, members, snapsLoading, membersLoading]);

  return (
    <>
      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__content">
            {snapsLoading && storesLoading && membersLoading ? (
              <div className="u-fixed-width">
                <Spinner text="Loading&hellip;" />
              </div>
            ) : (
              <>
                {!isReloading && currentMember?.roles && isAdmin() && (
                  <div className="u-fixed-width">
                    <SectionNav sectionName="snaps" />
                  </div>
                )}
                {!isReloading && currentMember?.roles && (
                  <Row>
                    <Col size="6">
                      {!isAdmin() && (
                        <h2 className="p-heading--4">
                          Snaps in {getStoreName(id)}
                        </h2>
                      )}

                      {isAdmin() && (
                        <>
                          <Button onClick={() => setSidePanelOpen(true)}>
                            Include snap
                          </Button>
                          <Button
                            disabled={
                              snapsToRemove.length < 1 || removeSnapSaving
                            }
                            onClick={removeSnaps}
                            className={removeSnapSaving ? "has-icon" : ""}
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
                        </>
                      )}
                    </Col>
                    <Col size="6">
                      <SnapsFilter
                        setSnapsInStore={setSnapsInStore}
                        snapsInStore={snapsInStore}
                        setOtherStores={setOtherStores}
                        otherStoreIds={otherStoreIds}
                        getStoreName={getStoreName}
                        snaps={snaps}
                        id={id}
                      />
                    </Col>
                  </Row>
                )}
                <div className="u-fixed-width">
                  {isReloading ? (
                    <Spinner text="Loading&hellip;" />
                  ) : (
                    <SnapsTable
                      snaps={snapsInStore}
                      storeName={getStoreName(id)}
                      otherStores={otherStores}
                      snapsToRemove={snapsToRemove}
                      setSnapsToRemove={setSnapsToRemove}
                      nonEssentialSnapIds={nonEssentialSnapIds}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <aside
        className={`l-aside ${sidePanelOpen ? "" : "is-collapsed"}`}
        id="aside-panel"
      >
        <div className="p-panel is-flex-column">
          <div className="p-panel__header">
            <h4 className="p-panel__title">Add a snap to {getStoreName(id)}</h4>
          </div>
          <div className="p-panel__content u-no-padding--top">
            <div className="u-fixed-width">
              <SnapsSearch
                selectedSnaps={selectedSnaps}
                setSelectedSnaps={setSelectedSnaps}
                getStoreName={getStoreName}
                storeId={id}
                nonEssentialSnapIds={nonEssentialSnapIds}
              />
              {selectedSnaps.length ? (
                <ul>
                  {selectedSnaps.map((snap) => {
                    <li key={snap.id}>{snap.name}</li>;
                  })}
                </ul>
              ) : null}
            </div>
          </div>
          <div className="p-panel__footer u-align--right">
            <div className="u-fixed-width">
              <Button
                className="u-no-margin--bottom"
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
                onClick={addSnaps}
                className={`u-no-margin--bottom u-no-margin--right ${
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
    </>
  );
}

export default Snaps;
