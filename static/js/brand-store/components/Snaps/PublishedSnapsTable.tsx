import { format, parseISO } from "date-fns";

import type { Snap } from "../../types/shared";
import { MainTable } from "@canonical/react-components";
import { ReactNode } from "react";

type Props = {
  snapsInStore: Array<Snap>;
};

function PublishedSnapsTable({ snapsInStore }: Props): ReactNode {
  return (
    <>
      {snapsInStore.length > 0 ? (
        <MainTable
          sortable
          headers={[
            { content: "Name", sortKey: "name" },
            { content: "Latest release", sortKey: "latestRelease" },
            { content: "Release date", sortKey: "releaseDate" },
            { content: "Publisher", sortKey: "publisher" },
          ]}
          rows={snapsInStore.map((snap: Snap) => {
            let releaseDate = null;
            if (snap["latest-release"] && snap["latest-release"].timestamp) {
              releaseDate = parseISO(snap["latest-release"].timestamp);
            }

            return {
              columns: [
                { content: snap.name },
                {
                  content:
                    snap["latest-release"] && snap["latest-release"].version
                      ? snap["latest-release"].version
                      : "-",
                },
                {
                  content: releaseDate
                    ? format(releaseDate, "dd/MM/yyyy")
                    : "-",
                },
                { content: snap.users[0].displayname },
              ],
              sortData: {
                name: snap.name,
                latestRelease: snap["latest-release"].version,
                releaseDate: releaseDate || "-",
                publisher: snap.users[0].displayname,
              },
            };
          })}
        />
      ) : (
        <p>There are currently no snaps in this store</p>
      )}
    </>
  );
}

export default PublishedSnapsTable;
