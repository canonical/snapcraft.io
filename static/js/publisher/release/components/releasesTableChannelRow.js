import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { getPendingChannelMap } from "../selectors";
import { getChannelName } from "../helpers";

import ReleasesTableRevisionsRow from "./releasesTableRevisionsRow";

const ReleasesTableChannelRow = props => {
  const {
    currentTrack,
    risk,
    branch,
    pendingChannelMap,
    pendingCloses
  } = props;

  const branchName = branch ? branch.branch : null;
  const channel = getChannelName(currentTrack, risk, branchName);

  const revisions = pendingChannelMap[channel];

  const canDrag = !(!revisions || pendingCloses.includes(channel));

  const { canDrop, draggedItem, isOverParent } = props;

  return (
    <ReleasesTableRevisionsRow
      risk={risk}
      branch={branch}
      revisions={revisions}
      canDrag={canDrag}
      isOverParent={isOverParent}
      draggedItem={draggedItem}
      canDrop={canDrop}
      isChannel={true}
    />
  );
};

ReleasesTableChannelRow.propTypes = {
  // props
  risk: PropTypes.string.isRequired,
  branch: PropTypes.object,
  // props dnd
  isOverParent: PropTypes.bool,
  draggedItem: PropTypes.object,
  canDrop: PropTypes.bool,

  // state
  currentTrack: PropTypes.string.isRequired,
  pendingCloses: PropTypes.array.isRequired,
  pendingChannelMap: PropTypes.object
};

const mapStateToProps = state => {
  return {
    currentTrack: state.currentTrack,
    pendingCloses: state.pendingCloses,
    pendingChannelMap: getPendingChannelMap(state)
  };
};

export default connect(mapStateToProps)(ReleasesTableChannelRow);
