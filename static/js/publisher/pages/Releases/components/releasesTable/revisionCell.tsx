import React from "react";

import { DND_ITEM_REVISIONS } from "../dnd";

import { canBeReleased } from "../../helpers";
import { ReleasesTableCellView, RevisionInfo, EmptyInfo } from "./cellViews";
import { Revision, CPUArchitecture } from "../../../../types/releaseTypes";

interface ReleasesTableRevisionCellProps {
  revision?: Revision | null;
  showVersion?: boolean; // Not used in the component logic, only in propTypes
  arch: CPUArchitecture;
}

// releases table cell with data for a specific revision (unrelated to channel map)
const ReleasesTableRevisionCell = (props: ReleasesTableRevisionCellProps) => {
  const { revision, arch } = props;

  const item = {
    revisions: [revision],
    architectures: revision ? revision.architectures : [],
    type: DND_ITEM_REVISIONS,
  };

  return (
    <ReleasesTableCellView
      item={item}
      canDrag={!!revision && canBeReleased(revision)}
      cellType="revision"
      arch={arch}
    >
      {revision ? <RevisionInfo revision={revision} /> : <EmptyInfo />}
    </ReleasesTableCellView>
  );
};

export default ReleasesTableRevisionCell;
