import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";

import SnapsTableRow from "./SnapsTableRow";
import { CheckboxInput } from "@canonical/react-components";

function SnapsTable({
  storeName,
  snaps,
  otherStores,
  snapsToRemove,
  setSnapsToRemove,
  nonEssentialSnapIds,
  isOnlyViewer,
  globalStore,
}) {
  const { id } = useParams();
  const [checkAll, setCheckAll] = useState(false);

  const tableCellClass = isOnlyViewer() ? "" : "table-cell--checkbox";

  useEffect(() => {
    setCheckAll(snapsToRemove.length === nonEssentialSnapIds.length);
  }, [snapsToRemove, nonEssentialSnapIds]);

  return (
    <table className="p-table--mobile-card u-no-margin--bottom">
      <thead>
        <tr>
          <th style={{ width: "15%" }}>Published in</th>
          <th className="u-hide-table-col--large">
            {/* Required for the mobile layout */}
          </th>
          <th className={tableCellClass}>
            {!isOnlyViewer() ? (
              <CheckboxInput
                onChange={(e) => {
                  if (e.target.checked) {
                    const otherStoresSnaps = otherStores.map(
                      (item) => item.snaps
                    );
                    setSnapsToRemove(
                      otherStoresSnaps.flat().filter((item) => !item.essential)
                    );
                    setCheckAll(true);
                  } else {
                    setSnapsToRemove([]);
                    setCheckAll(false);
                  }
                }}
                checked={checkAll}
                disabled={!nonEssentialSnapIds.length}
                label="Name"
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
            storeId={id}
            snap={snap}
            snapsCount={snaps.length}
            index={index}
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
          globalStore.snaps.map((snap, index) => (
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

SnapsTable.propTypes = {
  storeName: PropTypes.string.isRequired,
  snaps: PropTypes.array.isRequired,
  otherStores: PropTypes.array,
  snapsToRemove: PropTypes.array,
  setSnapsToRemove: PropTypes.func,
  nonEssentialSnapIds: PropTypes.array.isRequired,
  isOnlyViewer: PropTypes.func.isRequired,
  globalStore: PropTypes.object,
};

export default SnapsTable;
