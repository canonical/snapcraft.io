import React from "react";
import { useRecoilValue } from "recoil";
import { format } from "date-fns";
import { MainTable } from "@canonical/react-components";

import { filteredSnapsListState } from "../../selectors";

import type { Snap } from "../../types/shared";

function SnapsTable() {
  const snapsList = useRecoilValue<Array<Snap>>(filteredSnapsListState);
  const stores: string[] = [];

  snapsList.forEach((snap) => {
    if (!stores.includes(snap.store)) {
      stores.push(snap.store);
    }
  });

  const snapsInStores: Array<{ store: string; snaps: Array<Snap> }> = [];

  stores.forEach((store) => {
    snapsInStores.push({
      store,
      snaps: snapsList.filter((snap) => snap.store === store),
    });
  });

  return (
    <div className="u-flex-grow">
      <MainTable
        sortable
        emptyStateMsg="No snaps match this filter"
        headers={[
          {
            content: "Published in",
            style: {
              width: "15%",
            },
          },
          {
            content: "Name",
          },
          {
            content: "Latest release",
            style: { width: "15%" },
          },
          {
            content: "Release date",
            style: { width: "15%" },
          },
          {
            content: "Publisher",
          },
        ]}
        rows={snapsList.map((snap) => {
          return {
            columns: [
              {
                content: snap.store,
              },
              {
                content: snap.name || "-",
              },
              {
                content:
                  snap["latest-release"] && snap["latest-release"].version
                    ? snap["latest-release"].version
                    : "-",
              },
              {
                content: format(
                  new Date(snap["latest-release"].timestamp),
                  "dd/MM/yyyy"
                ),
              },
              {
                content: snap.users[0].displayname,
              },
            ],
          };
        })}
      />
    </div>
  );
}

export default SnapsTable;
