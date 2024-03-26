import React from "react";
import { format } from "date-fns";

import type { Snap } from "../../types/shared";

type Props = {
  snapsInStore: Array<Snap>;
};

function PublishedSnapsTable({ snapsInStore }: Props) {
  return (
    <>
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
    </>
  );
}

export default PublishedSnapsTable;
