import React from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";

function SnapsTableRow({ storeName, snap, snapsCount, index }) {
  return (
    <tr>
      {index === 0 ? (
        <td rowSpan={snapsCount} aria-label="Published in">
          {storeName}
        </td>
      ) : null}
      <td aria-label="Name">{snap.name}</td>
      <td aria-label="Latest release">
        {snap["latest-release"].version ? snap["latest-release"].version : "-"}
      </td>
      <td aria-label="Release date">
        {format(new Date(snap["latest-release"].timestamp), "dd/MM/yyyy")}
      </td>
      <td aria-label="Publisher">{snap.users[0].displayname}</td>
    </tr>
  );
}

SnapsTableRow.propTypes = {
  storeName: PropTypes.string.isRequired,
  snap: PropTypes.object.isRequired,
  snapsCount: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

export default SnapsTableRow;
