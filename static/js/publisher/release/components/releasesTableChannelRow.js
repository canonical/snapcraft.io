import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import {
  getArchitectures,
  getPendingChannelMap,
  getBranches
} from "../selectors";
import ReleasesTableCell, {
  ReleasesTableRevisionCell
} from "./releasesTableCell";
import { useDragging, DND_ITEM_REVISIONS } from "./dnd";

import { getChannelName, getRevisionsArchitectures } from "../helpers";
import ReleasesTableChannelCell from "./releasesTableChannelCell";

const ReleasesTableChannelRow = props => {
  const {
    currentTrack,
    risk,
    branch,
    numberOfBranches,
    archs,
    pendingChannelMap,
    openBranches,
    availableBranches,
    revisions,
    pendingCloses
  } = props;

  const branchName = branch ? branch.branch : null;

  const channel = getChannelName(currentTrack, risk, branchName);
  if (branch) {
    const parentChannel = getChannelName(currentTrack, risk);

    if (!openBranches || !openBranches.includes(parentChannel)) {
      return null;
    }
  }

  const rowRevisions = revisions || pendingChannelMap[channel];

  const canDrag = !(!rowRevisions || pendingCloses.includes(channel));

  const draggedRevisions = canDrag ? Object.values(rowRevisions) : [];

  const [isDragging, isGrabbing, drag, preview] = useDragging({
    item: {
      revisions: draggedRevisions,
      architectures: getRevisionsArchitectures(draggedRevisions),
      risk: props.risk,
      branch: branch ? branch.branch : null,
      type: DND_ITEM_REVISIONS
    },
    canDrag
  });

  let hasSameVersion = false;
  let versionsMap = {};

  if (rowRevisions) {
    // calculate map of architectures for each version
    for (const arch in rowRevisions) {
      const revision = rowRevisions[arch];
      const version = revision.version;
      if (!versionsMap[version]) {
        versionsMap[version] = [];
      }
      versionsMap[version].push(arch);
    }

    hasSameVersion = Object.keys(versionsMap).length === 1;
  }

  // TODO:
  const { canDrop, item, isOverParent } = props;

  return (
    <div
      ref={preview}
      className={`p-releases-table__row p-releases-table__row--${
        branch ? "branch" : "channel"
      } p-releases-table__row--${risk} ${isDragging ? "is-dragging" : ""} ${
        isGrabbing ? "is-grabbing" : ""
      } ${canDrop ? "can-drop" : ""}`}
    >
      <ReleasesTableChannelCell
        drag={drag}
        risk={risk}
        branch={branch}
        revisions={revisions}
        numberOfBranches={numberOfBranches}
        availableBranches={availableBranches}
      />

      {archs.map(
        arch =>
          revisions ? (
            <ReleasesTableRevisionCell
              key={`${currentTrack}/${risk}/${arch}`}
              revision={rowRevisions[arch]}
              showVersion={!hasSameVersion}
            />
          ) : (
            <ReleasesTableCell
              key={`${currentTrack}/${risk}/${arch}`}
              track={currentTrack}
              risk={risk}
              branch={branch}
              arch={arch}
              showVersion={!hasSameVersion}
              isOverParent={
                isOverParent &&
                canDrop &&
                item.architectures.indexOf(arch) !== -1
              }
            />
          )
      )}
    </div>
  );
};

ReleasesTableChannelRow.propTypes = {
  // props
  risk: PropTypes.string.isRequired,
  branch: PropTypes.object,
  numberOfBranches: PropTypes.number,
  revisions: PropTypes.object,
  // props dnd
  isOverParent: PropTypes.bool,
  item: PropTypes.object,
  canDrop: PropTypes.bool,

  // state
  availableBranches: PropTypes.array,
  currentTrack: PropTypes.string.isRequired,
  pendingCloses: PropTypes.array.isRequired,
  archs: PropTypes.array.isRequired,
  pendingChannelMap: PropTypes.object,
  openBranches: PropTypes.array
};

const mapStateToProps = state => {
  return {
    currentTrack: state.currentTrack,
    pendingCloses: state.pendingCloses,
    archs: getArchitectures(state),
    pendingChannelMap: getPendingChannelMap(state),
    openBranches: state.branches,
    availableBranches: getBranches(state)
  };
};

export default connect(mapStateToProps)(ReleasesTableChannelRow);
