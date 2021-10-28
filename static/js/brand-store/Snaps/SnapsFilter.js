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
    <div className="p-search-box">
      <input
        type="search"
        className="p-search-box__input"
        name="search-snaps"
        id="search-snaps"
        placeholder="Search snaps"
        autoComplete="off"
        onKeyUp={(e) => {
          if (e.target.value) {
            setSnapsInStore(
              snapsInStore.filter((snap) => snap.name.includes(e.target.value))
            );
            setOtherStores(
              otherStoreIds.map((storeId) => {
                return {
                  id: storeId,
                  name: getStoreName(storeId),
                  snaps: snaps.filter(
                    (snap) =>
                      snap.store === storeId &&
                      snap.name.includes(e.target.value)
                  ),
                };
              })
            );
          } else {
            setSnapsInStore(snaps.filter((snap) => snap.store === id));
            setOtherStores(
              otherStoreIds.map((storeId) => {
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
      <button type="submit" className="p-search-box__button">
        <i className="p-icon--search"></i>
      </button>
    </div>
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
