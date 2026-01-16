import React from "react";
import { connect } from "react-redux";

import { getArchitectures, getPendingChannelMap } from "../../selectors";
import { isSameVersion, getChannelName } from "../../helpers";

import ReleasesTableReleaseCell from "./releaseCell";
import ReleasesTableRow from "./row";
import {
  ReleasesReduxState,
  CPUArchitecture,
  ChannelArchitectureRevisionsMap,
  Channel,
  Revision,
} from "../../../../types/releaseTypes";

// Type for branch object based on usage in the component
interface Branch {
  branch: string;
}

// Type for draggedItem based on usage in droppableRow.tsx
interface DraggedItem {
  revisions: Revision[];
  architectures: CPUArchitecture[];
  risk: string;
  branch: string | null;
  type: string;
}

interface OwnProps {
  risk: string;
  branch?: Branch;
  // Props from DnD
  isOverParent?: boolean;
  draggedItem?: DraggedItem;
  canDrop?: boolean;
}

interface StateProps {
  currentTrack: string;
  pendingCloses: Channel["name"][];
  pendingChannelMap: ChannelArchitectureRevisionsMap;
  archs: CPUArchitecture[];
}

type ReleasesTableChannelRowProps = OwnProps & StateProps;

// releases table row based on channel data
const ReleasesTableChannelRow = (props: ReleasesTableChannelRowProps) => {
  const {
    currentTrack,
    risk,
    branch,
    pendingChannelMap,
    pendingCloses,
    archs,
  } = props;

  const branchName = branch ? branch.branch : null;
  const channel = getChannelName(currentTrack, risk, branchName);

  const revisions = pendingChannelMap[channel];

  const canDrag = !(!revisions || pendingCloses.includes(channel));

  const { canDrop, draggedItem, isOverParent } = props;

  const showVersion = !isSameVersion(revisions);

  return (
    <ReleasesTableRow
      risk={risk}
      branch={branch}
      revisions={revisions}
      canDrag={canDrag}
      isOverParent={isOverParent}
      draggedItem={draggedItem}
      canDrop={canDrop}
    >
      {archs.map((arch) => {
        return (
          <ReleasesTableReleaseCell
            key={`${currentTrack}/${risk}/${arch}`}
            current={`${currentTrack}/${risk}`}
            track={currentTrack}
            risk={risk}
            branch={branch}
            arch={arch}
            showVersion={showVersion}
            isOverParent={
              isOverParent &&
              canDrop &&
              draggedItem &&
              draggedItem.architectures.indexOf(arch) !== -1
            }
          />
        );
      })}
    </ReleasesTableRow>
  );
};

const mapStateToProps = (state: ReleasesReduxState): StateProps => {
  return {
    currentTrack: state.currentTrack,
    pendingCloses: state.pendingCloses,
    pendingChannelMap: getPendingChannelMap(state),
    archs: getArchitectures(state),
  };
};

export default connect(mapStateToProps)(ReleasesTableChannelRow);
