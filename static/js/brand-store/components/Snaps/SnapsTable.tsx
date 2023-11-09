import React from "react";
import { useRecoilValue } from "recoil";
import { MainTable } from "@canonical/react-components";

import { filteredSnapsListState } from "../../selectors";

import type { Snap } from "../../types/shared";

function SnapsTable() {
  const snapsList = useRecoilValue<Array<Snap>>(filteredSnapsListState);

  return (
    <div className="u-flex-grow">
      <MainTable
        sortable
        emptyStateMsg="No snaps match this filter"
        headers={[{ content: "Name", sortKey: "name" }]}
        rows={snapsList.map((snap: Snap) => {
          return {
            columns: [
              {
                content: snap.name,
              },
            ],
          };
        })}
      />
    </div>
  );
}

export default SnapsTable;
