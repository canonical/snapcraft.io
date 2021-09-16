import React from "react";
import PropTypes from "prop-types";

import SnapsTableRow from "./SnapsTableRow";

function SnapsTable({ storeName, snaps, otherStores }) {
  return (
    <table className="p-table--mobile-card">
      <thead>
        <tr>
          <th>Published in</th>
          <th>Name</th>
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
                snap={snap}
                snapsCount={store.snaps.length}
                index={index}
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
};

export default SnapsTable;
