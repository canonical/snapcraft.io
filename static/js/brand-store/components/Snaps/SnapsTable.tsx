import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import SnapsTableRow from "./SnapsTableRow";
import { Input } from "@canonical/react-components";

import type { SnapsList, Store, Stores, Snap } from "../../types/shared";

type Props = {
  storeName: string;
  snaps: SnapsList;
  otherStores: Stores;
  snapsToRemove: SnapsList;
  setSnapsToRemove: Function;
  nonEssentialSnapIds: SnapsList;
  isOnlyViewer: Function;
  globalStore: Store;
};

function SnapsTable({
  storeName,
  snaps,
  otherStores,
  snapsToRemove,
  setSnapsToRemove,
  nonEssentialSnapIds,
  isOnlyViewer,
  globalStore,
}: Props) {
  const { id } = useParams();

  const [isChecked, setIsChecked] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  const tableCellClass = isOnlyViewer() ? "" : "table-cell--checkbox";

  const otherStoresSnaps = otherStores.map((item) => item?.snaps);
  const allSnaps = otherStoresSnaps.flat().concat(globalStore?.snaps);

  useEffect(() => {
    if (snapsToRemove.length) {
      if (snapsToRemove.length === nonEssentialSnapIds.length) {
        setIsChecked(true);
        setIsIndeterminate(false);
      } else {
        setIsChecked(false);
        setIsIndeterminate(true);
      }
    } else {
      setIsChecked(false);
      setIsIndeterminate(false);
    }
  }, [snapsToRemove]);

  return (
    <table className="p-table--mobile-card u-no-margin--bottom">
      <caption className="u-screenreader-only">
        The snaps which are published in and available to the {storeName} store.
      </caption>
      <thead>
        <tr>
          <th style={{ width: "15%" }}>Published in</th>
          <th className="u-hide-table-col--large">
            {/* Required for the mobile layout */}
          </th>
          <th className={tableCellClass}>
            {!isOnlyViewer() ? (
              <Input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSnapsToRemove(
                      allSnaps.filter((item) => !item.essential)
                    );
                    setIsChecked(true);
                  } else {
                    setSnapsToRemove([]);
                    setIsChecked(false);
                  }
                }}
                disabled={!nonEssentialSnapIds.length}
                label="Name"
                checked={isChecked}
                // @ts-ignore
                indeterminate={isIndeterminate}
              />
            ) : (
              "Name"
            )}
          </th>
          <th style={{ width: "15%" }}>Latest release</th>
          <th style={{ width: "15%" }}>Release date</th>
          <th>Publisher</th>
        </tr>
      </thead>
      <tbody>
        {snaps.map((snap, index) => (
          <SnapsTableRow
            key={snap.id}
            storeName={storeName}
            storeId={id ? id : globalStore.id}
            snap={snap}
            snapsCount={snaps.length}
            index={index}
            snapsToRemove={snapsToRemove}
            setSnapsToRemove={setSnapsToRemove}
            isOnlyViewer={isOnlyViewer}
          />
        ))}
        {otherStores &&
          otherStores.map((store) => {
            return store.snaps.map((snap, index) => (
              <SnapsTableRow
                key={snap.id}
                storeName={store.name}
                storeId={store.id}
                snap={snap}
                snapsCount={store.snaps.length}
                index={index}
                snapsToRemove={snapsToRemove}
                setSnapsToRemove={setSnapsToRemove}
                isOnlyViewer={isOnlyViewer}
              />
            ));
          })}
        {globalStore &&
          globalStore.snaps.map((snap: Snap, index: number) => (
            <SnapsTableRow
              key={snap.id}
              storeName={globalStore.name}
              storeId={globalStore.id}
              snap={snap}
              snapsCount={globalStore.snaps.length}
              index={index}
              snapsToRemove={snapsToRemove}
              setSnapsToRemove={setSnapsToRemove}
              isOnlyViewer={isOnlyViewer}
            />
          ))}
      </tbody>
    </table>
  );
}

export default SnapsTable;
