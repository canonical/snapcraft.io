import React from "react";
import { useRecoilValue } from "recoil";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { MainTable } from "@canonical/react-components";

import { brandStoresState } from "../../atoms";
import { filteredSnapsListState } from "../../selectors";

import { getStoreName } from "../../utils";

import type { Snap, Store } from "../../types/shared";

function SnapsTable() {
  const snapsList = useRecoilValue<Array<Snap>>(filteredSnapsListState);
  const stores: string[] = [];

  const brandStores = useRecoilValue<Array<Store>>(brandStoresState);

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

  const makeRows = (group: { store: string; snaps: Array<Snap> }) => {
    return group.snaps.map((snap, index) => {
      const columns = [];

      if (index === 0) {
        columns.push({
          content: getStoreName(group.store, brandStores),
          rowSpan: group.snaps.length,
        });
      }

      const name = () => {
        if (!snap.name) {
          return "-";
        }

        if (group.store === "ubuntu") {
          return <a href={`/${snap.name}`}>{snap.name}</a>;
        }

        return snap.name;
      };

      columns.push({
        content: name(),
      });

      columns.push({
        content:
          snap["latest-release"] && snap["latest-release"].version
            ? snap["latest-release"].version
            : "-",
      });

      columns.push({
        content: format(
          new Date(snap["latest-release"].timestamp),
          "dd/MM/yyyy"
        ),
      });

      columns.push({
        content: snap.users[0].displayname,
      });

      return {
        columns,
      };
    });
  };

  return (
    <div className="u-flex-grow">
      <MainTable
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
