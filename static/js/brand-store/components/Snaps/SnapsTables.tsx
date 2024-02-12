import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { Input } from "@canonical/react-components";

import type { Snap, SnapsList, Store } from "../../types/shared";

type SnapTableRowProps = {
  snap: Snap;
  isGlobal?: boolean;
  getStoreName?: Function;
  isOnlyViewer: Function;
  snapsToRemove: SnapsList;
  setSnapsToRemove: Function;
};

function SnapsTableRow({
  snap,
  isGlobal,
  getStoreName,
  isOnlyViewer,
  snapsToRemove,
  setSnapsToRemove,
}: SnapTableRowProps) {
  const { id } = useParams();

  const [isChecked, setIsChecked] = useState(false);

  const tableCellClass = isOnlyViewer()
    ? "u-truncate"
    : "table-cell--checkbox u-truncate";

  const snapName = isGlobal ? (
    <a href={`https://snapcraft.io/${snap.name}`}>{snap.name}</a>
  ) : (
    snap.name || "-"
  );

  useEffect(() => {
    setIsChecked(
      snapsToRemove.find((item: Snap) => item.id === snap.id) ? true : false
    );
  }, [snapsToRemove]);

  return (
    <tr key={snap.id}>
      <td className={tableCellClass}>
        {snap.store !== id && !snap.essential && !isOnlyViewer() ? (
          <Input
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) {
                setSnapsToRemove([...snapsToRemove, snap]);
              } else {
                setSnapsToRemove([
                  ...snapsToRemove.filter((item) => item.id !== snap.id),
                ]);
              }
            }}
            checked={isChecked}
            label={snapName}
          />
        ) : (
          <span style={{ marginLeft: "0.5rem" }}>{snapName}</span>
        )}
      </td>
      <td className="u-truncate">
        {isGlobal
          ? "Global"
          : (getStoreName && getStoreName(snap.store)) || snap.store}
      </td>
      <td className="u-truncate">
        {snap["latest-release"] && snap["latest-release"].version
          ? snap["latest-release"].version
          : "-"}
      </td>
      <td className="u-truncate">
        {format(new Date(snap["latest-release"].timestamp), "dd/MM/yyyy")}
      </td>
      <td className="u-truncate">{snap.users[0].displayname}</td>
    </tr>
  );
}

type SnapTableRowsProps = {
  snaps: Array<Snap>;
  getStoreName?: Function;
  isGlobal?: boolean;
  isOnlyViewer: Function;
  snapsToRemove: SnapsList;
  setSnapsToRemove: Function;
};

function SnapTableRows({
  snaps,
  getStoreName,
  isGlobal,
  isOnlyViewer,
  snapsToRemove,
  setSnapsToRemove,
}: SnapTableRowsProps) {
  return (
    <>
      {snaps.map((snap) => (
        <SnapsTableRow
          key={snap.id}
          snap={snap}
          isGlobal={isGlobal}
          getStoreName={getStoreName}
          isOnlyViewer={isOnlyViewer}
          snapsToRemove={snapsToRemove}
          setSnapsToRemove={setSnapsToRemove}
        />
      ))}
    </>
  );
}

type SnapTablesProps = {
  currentStoreName: string;
  snapsInStore: Array<Snap>;
  otherStores: Array<{
    id: string;
    name: string;
    snaps: Array<Snap>;
  }>;
  globalStore: Store;
  getStoreName: Function;
  isOnlyViewer: Function;
  snapsToRemove: SnapsList;
  setSnapsToRemove: Function;
  nonEssentialSnapIds: SnapsList;
};

function SnapsTables({
  currentStoreName,
  snapsInStore,
  otherStores,
  globalStore,
  getStoreName,
  isOnlyViewer,
  snapsToRemove,
  setSnapsToRemove,
  nonEssentialSnapIds,
}: SnapTablesProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  const otherStoresSnaps = otherStores.map((item) => item?.snaps);
  const allSnaps = otherStoresSnaps.flat().concat(globalStore?.snaps);
  const tableCellClass = isOnlyViewer() ? "" : "table-cell--checkbox";

  const deDupedSnaps = (snaps: Array<Snap>, sourceStoreId: string) => {
    return snaps.filter((snap) => snap.store === sourceStoreId);
  };

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
    <>
      <h1 className="p-heading--5">{currentStoreName} snaps</h1>

      {snapsInStore.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Latest release</th>
              <th>Release date</th>
              <th>Publisher</th>
            </tr>
          </thead>
          <tbody>
            {snapsInStore.map((snap: Snap) => (
              <tr key={snap.id}>
                <td className="u-truncate">{snap.name}</td>
                <td className="u-truncate">
                  {snap["latest-release"] && snap["latest-release"].version
                    ? snap["latest-release"].version
                    : "-"}
                </td>
                <td className="u-truncate">
                  {format(
                    new Date(snap["latest-release"].timestamp),
                    "dd/MM/yyyy"
                  )}
                </td>
                <td className="u-truncate">{snap.users[0].displayname}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>There are currently no snaps in this store</p>
      )}

      <h2 className="p-heading--5">Snaps from other stores</h2>
      <table>
        <thead>
          <tr>
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
            <th>Source store</th>
            <th>Latest release</th>
            <th>Release date</th>
            <th>Publisher</th>
          </tr>
        </thead>
        <tbody>
          {otherStores.map((store) => (
            <SnapTableRows
              key={store.id}
              snaps={deDupedSnaps(store.snaps, store.id)}
              getStoreName={getStoreName}
              isOnlyViewer={isOnlyViewer}
              snapsToRemove={snapsToRemove}
              setSnapsToRemove={setSnapsToRemove}
            />
          ))}
          <SnapTableRows
            snaps={deDupedSnaps(globalStore.snaps, "ubuntu")}
            isGlobal={true}
            isOnlyViewer={isOnlyViewer}
            snapsToRemove={snapsToRemove}
            setSnapsToRemove={setSnapsToRemove}
          />
        </tbody>
      </table>
    </>
  );
}

export default SnapsTables;
