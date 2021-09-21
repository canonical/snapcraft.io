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
}) {
  const { id } = useParams();
  const [checkAll, setCheckAll] = useState(false);

  useEffect(() => {
    setCheckAll(snapsToRemove.length === nonEssentialSnapIds.length);
  }, [snapsToRemove, nonEssentialSnapIds]);

  return (
    <table className="p-table--mobile-card">
      <thead>
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
            />
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
              />
            ));
          })}
      </tbody>
    </table>
  );
}

SnapsTable.propTypes = {
  storeName: PropTypes.string.isRequired,
  snaps: PropTypes.array.isRequired,
  otherStores: PropTypes.object,
  snapsToRemove: PropTypes.array,
  setSnapsToRemove: PropTypes.func,
  nonEssentialSnapIds: PropTypes.array.isRequired,
};

export default SnapsTable;
