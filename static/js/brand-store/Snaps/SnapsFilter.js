import React from "react";
import PropTypes from "prop-types";

function SnapsFilter({
  setSnapsInStore,
  snapsInStore,
  setOtherStores,
  otherStoreIds,
  getStoreName,
  snaps,
  id,
}) {
  return (
    <input
      type="text"
      name="search-snaps"
      id="search-snaps"
      placeholder="Search snaps"
      onKeyUp={(e) => {
        if (e.target.value) {
          setSnapsInStore(
            snapsInStore.filter((snap) => snap.name.includes(e.target.value))
          );
          setOtherStores(
            Array.from(otherStoreIds).map((storeId) => {
              return {
                id: storeId,
                name: getStoreName(storeId),
                snaps: snaps.filter(
                  (snap) =>
                    snap.store === storeId && snap.name.includes(e.target.value)
                ),
              };
            })
          );
        } else {
          setSnapsInStore(snaps.filter((snap) => snap.store === id));
          setOtherStores(
            Array.from(otherStoreIds).map((storeId) => {
              return {
                id: storeId,
                name: getStoreName(storeId),
                snaps: snaps.filter((snap) => snap.store === storeId),
              };
            })
          );
        }
      }}
    />
  );
}

SnapsFilter.propTypes = {
  setSnapsInStore: PropTypes.func.isRequired,
  snapsInStore: PropTypes.array.isRequired,
  setOtherStores: PropTypes.func.isRequired,
  otherStoreIds: PropTypes.array.isRequired,
  getStoreName: PropTypes.func.isRequired,
  snaps: PropTypes.array.isRequired,
  id: PropTypes.string.isRequired,
};

export default SnapsFilter;
