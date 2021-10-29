import React from "react";
import PropTypes from "prop-types";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { CheckboxInput } from "@canonical/react-components";

function SnapsTableRow({
  storeName,
  storeId,
  snap,
  snapsCount,
  index,
  snapsToRemove,
  setSnapsToRemove,
}) {
  const { id } = useParams();

  return (
    <tr>
      {index === 0 ? (
        <td
          className="snap-published-in-cell"
          rowSpan={snapsCount}
          aria-label="Published in"
        >
          {storeName}
        </td>
      ) : null}
      <td aria-label="Name" className="table-cell--checkbox">
        {storeId !== id && !snap.essential ? (
          <CheckboxInput
            onChange={(e) => {
              if (e.target.checked) {
                setSnapsToRemove([].concat(snapsToRemove, [snap]));
              } else {
                setSnapsToRemove([
                  ...snapsToRemove.filter((item) => item.id !== snap.id),
                ]);
              }
            }}
            checked={snapsToRemove.find((item) => item.id === snap.id)}
          />
        ) : null}
        {storeId === "ubuntu" ? (
          <a href={`/${snap.name}`}>{snap.name}</a>
        ) : (
          snap.name
        )}
      </td>
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
  storeId: PropTypes.string.isRequired,
  snap: PropTypes.object.isRequired,
  snapsCount: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
  snapsToRemove: PropTypes.array,
  setSnapsToRemove: PropTypes.func,
};

export default SnapsTableRow;
