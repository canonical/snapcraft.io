import React from "react";
import { useRecoilValue } from "recoil";
import { format } from "date-fns";
import { MainTable } from "@canonical/react-components";

import { filteredSnapsListState } from "../../selectors";

import type { Snap } from "../../types/shared";

function makeRows(group: { store: string; snaps: Array<Snap> }) {
  return group.snaps.map((snap, index) => {
    const columns = [];

    if (index === 0) {
      columns.push({
        content: group.store,
        rowSpan: group.snaps.length,
      });
    }

    columns.push({
      content: snap.name || "-",
    });

    columns.push({
      content:
        snap["latest-release"] && snap["latest-release"].version
          ? snap["latest-release"].version
          : "-",
    });

    columns.push({
      content: format(new Date(snap["latest-release"].timestamp), "dd/MM/yyyy"),
    });

    columns.push({
      content: snap.users[0].displayname,
    });

    return {
      columns,
    };
  });
}

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
        rows={snapsInStores
          .map((group) => {
            return makeRows(group);
          })
          .flat()}
      />
    </div>
  );
}

export default SnapsTable;
