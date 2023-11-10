import React from "react";
import { useRecoilValue } from "recoil";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { MainTable } from "@canonical/react-components";

import { brandStoresState } from "../../atoms";
import { filteredSnapsListState, currentMemberState } from "../../selectors";

import { getStoreName } from "../../utils";

import type { Snap, Store, Member } from "../../types/shared";

function SnapsTable() {
  const snapsList = useRecoilValue<Array<Snap>>(filteredSnapsListState);
  const stores: string[] = [];

  const { id } = useParams();

  const brandStores = useRecoilValue<Array<Store>>(brandStoresState);
  const currentMember = useRecoilValue<Member | undefined>(currentMemberState);

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
        if (
          currentMember &&
          currentMember.roles.includes("admin") &&
          !snap.essential &&
          group.store !== id
        ) {
          return (
            <>
              <label className="p-checkbox">
                <input
                  type="checkbox"
                  className="p-checkbox__input"
                  onChange={() => false}
                  checked={false}
                />
                <span className="p-checkbox__label">
                  {group.store === "ubuntu" ? (
                    <a href={`/${snap.name}`}>{snap.name}</a>
                  ) : (
                    <span style={{ marginLeft: "0.5rem" }}>{snap.name}</span>
                  )}
                </span>
              </label>
            </>
          );
        }

        if (!snap.name) {
          return <span style={{ marginLeft: "0.5rem" }}>-</span>;
        }

        if (group.store === "ubuntu") {
          return (
            <a href={`/${snap.name}`}>
              <span style={{ marginLeft: "0.5rem" }}>{snap.name}</span>
            </a>
          );
        }

        return <span style={{ marginLeft: "0.5rem" }}>snap.name</span>;
      };

      columns.push({
        content: name(),
        className: "table-cell--checkbox",
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
            className: "table-cell--checkbox",
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
