import React, { KeyboardEvent } from "react";

import type { SnapsList } from "../../types/shared";

type Props = {
  setSnapsInStore: Function;
  snapsInStore: SnapsList;
  setOtherStores: Function;
  otherStoreIds: Array<string>;
  getStoreName: Function;
  snaps: SnapsList;
  id: string;
};

function SnapsFilter({
  setSnapsInStore,
  snapsInStore,
  setOtherStores,
  otherStoreIds,
  getStoreName,
  snaps,
  id,
}: Props) {
  return (
    <div className="p-search-box">
      <input
        type="search"
        className="p-search-box__input"
        name="search-snaps"
        id="search-snaps"
        placeholder="Search snaps"
        autoComplete="off"
        onKeyUp={(
          e: KeyboardEvent<HTMLInputElement> & {
            target: HTMLInputElement;
          }
        ) => {
          if (e.target.value) {
            setSnapsInStore(
              snapsInStore.filter((snap) =>
                snap?.name?.includes(e.target.value)
              )
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

export default SnapsFilter;
