import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Spinner, Row, Col } from "@canonical/react-components";

import { snapsSelector, brandStoresListSelector } from "../selectors";
import { fetchSnaps } from "../slices/snapsSlice";

import SnapsTable from "./SnapsTable";
import SnapsFilter from "./SnapsFilter";
import SectionNav from "../SectionNav";

function Snaps() {
  const brandStoresList = useSelector(brandStoresListSelector);
  const snaps = useSelector(snapsSelector);
  const snapsLoading = useSelector((state) => state.snaps.loading);
  const storesLoading = useSelector((state) => state.brandStores.loading);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [snapsInStore, setSnapsInStore] = useState([]);
  const [otherStoreIds, setOtherStoreIds] = useState([]);
  const [otherStores, setOtherStores] = useState([]);

  const getStoreName = (storeId) => {
    const store = brandStoresList.find((item) => item.id === storeId);

    if (store) {
      return store.name;
    } else {
      return storeId;
    }
  };

  useEffect(() => {
    dispatch(fetchSnaps(id));
  }, [id]);

  useEffect(() => {
    setSnapsInStore(snaps.filter((snap) => snap.store === id));

    setOtherStoreIds(
      new Set(
        snaps
          .filter((snap) => snap.store !== id)
          .map((snap) => {
            return snap.store;
          })
      )
    );
  }, [snaps]);

  useEffect(() => {
    setOtherStores(
      Array.from(otherStoreIds).map((storeId) => {
        return {
          id: storeId,
          name: getStoreName(storeId),
          snaps: snaps.filter((snap) => snap.store === storeId),
        };
      })
    );
  }, [otherStoreIds]);

  return (
    <main className="l-main">
      <div className="p-panel">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <SectionNav sectionName="snaps" />
          </div>
          {snapsLoading && storesLoading ? (
            <div className="u-fixed-width">
              <Spinner text="Loading&hellip;" />
            </div>
          ) : (
            <>
              <Row>
                <Col size="6">
                  <h2 className="p-heading--4">Snaps in {getStoreName(id)}</h2>
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
              <div className="u-fixed-width">
                <SnapsTable
                  snaps={snapsInStore}
                  storeName={getStoreName(id)}
                  otherStores={otherStores}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default Snaps;
