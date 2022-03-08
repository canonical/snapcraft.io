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
}) {
  const { id } = useParams();
  const [checkAll, setCheckAll] = useState(false);

  const tableCellClass = isOnlyViewer() ? "" : "table-cell--checkbox";

  useEffect(() => {
    setCheckAll(snapsToRemove.length === nonEssentialSnapIds.length);
  }, [snapsToRemove, nonEssentialSnapIds]);

  return (
    <div>
      <h3 className="p-heading--4 u-hide--medium u-hide--large">
        Published in {storeName}
      </h3>
      <table className="p-table--mobile-card u-no-margin--bottom">
        <thead>
          <tr>
            <th>Published in</th>
            <th className={tableCellClass}>
              {!isOnlyViewer() && (
                <CheckboxInput
                  onChange={(e) => {
                    if (e.target.checked) {
                      const otherStoresSnaps = otherStores.map(
                        (item) => item.snaps
                      );
                      setSnapsToRemove(
                        otherStoresSnaps
                          .flat()
                          .filter((item) => !item.essential)
                      );
                      setCheckAll(true);
                    } else {
                      setSnapsToRemove([]);
                      setCheckAll(false);
                    }
                  }}
                  checked={checkAll}
                  disabled={!nonEssentialSnapIds.length}
                />
              )}
              Name
            </th>
            <th>Latest release</th>
            <th>Release date</th>
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
        </tbody>
      </table>

      {otherStores &&
        otherStores.map((store) => {
          return (
            <div key={store.id}>
              <h3 className="p-heading--4 u-hide--medium u-hide--large">
                Published in {store.name}
              </h3>
              <table
                className="p-table--mobile-card snap-sub-table"
                key={store.id}
              >
                <thead className="u-hide">
                  <tr>
                    <th>Published in</th>
                    <th className="table-cell-head--checkbox">
                      <CheckboxInput
                        onChange={(e) => {
                          if (e.target.checked) {
                            const otherStoresSnaps = otherStores.map(
                              (item) => item.snaps
                            );
                            setSnapsToRemove(
                              otherStoresSnaps
                                .flat()
                                .filter((item) => !item.essential)
                            );
                            setCheckAll(true);
                          } else {
                            setSnapsToRemove([]);
                            setCheckAll(false);
                          }
                        }}
                        checked={checkAll}
                        disabled={!nonEssentialSnapIds.length}
                      />
                      Name
                    </th>
                    <th>Latest release</th>
                    <th>Release date</th>
                    <th>Publisher</th>
                  </tr>
                </thead>
                <tbody>
                  {store.snaps.map((snap, index) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
    </div>
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
};

export default SnapsTable;
