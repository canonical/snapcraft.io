import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { getPendingChannelMap } from "../selectors";
import { useDrop, DND_ITEM_REVISIONS } from "./dnd";

import { promoteRevision } from "../actions/pendingReleases";

import { STABLE, CANDIDATE, BETA, EDGE } from "../constants";

import { getChannelName, isInDevmode } from "../helpers";

import ReleasesTableChannelRow from "./releasesTableChannelRow";

const getRevisionsToDrop = (revisions, targetChannel, channelMap) => {
  const targetChannelArchs = channelMap[targetChannel];

  return revisions.filter(revision => {
    return revision.architectures.some(arch => {
      // if nothing released to target channel in this arch
      if (!targetChannelArchs || !targetChannelArchs[arch]) {
        return true;
      } else {
        // if different revision released to an arch
        if (revision.revision !== targetChannelArchs[arch].revision) {
          return true;
        }
      }
      return false;
    });
  });
};

const ReleasesTableRow = props => {
  const {
    currentTrack,
    risk,
    branch,
    revisions,
    promoteRevision,
    pendingChannelMap
  } = props;

  const branchName = branch ? branch.branch : null;

  const channel = getChannelName(currentTrack, risk, branchName);

  const [{ isOver, canDrop, item }, drop] = useDrop({
    accept: DND_ITEM_REVISIONS,
    drop: item => {
      item.revisions.forEach(r => promoteRevision(r, channel));
    },
    canDrop: item => {
      const draggedRevisions = item.revisions;

      const branchName = branch ? branch.branch : null;

      const draggedChannel = getChannelName(
        currentTrack,
        item.risk,
        item.branch
      );
      const dropChannel = getChannelName(currentTrack, risk, branchName);

      // can't drop on 'available revisions row'
      if (
        risk !== STABLE &&
        risk !== CANDIDATE &&
        risk !== BETA &&
        risk !== EDGE
      ) {
        return false;
      }

      // can't drop on itself
      if (draggedChannel === dropChannel) {
        return false;
      }

      // can't drop if there is nothing in dragged revisions
      if (!draggedRevisions.length) {
        return false;
      }

      // can't drop devmode to stable/candidate
      if (risk === STABLE || risk === CANDIDATE) {
        const hasDevmodeRevisions = draggedRevisions.some(isInDevmode);

        if (hasDevmodeRevisions) {
          return false;
        }
      }

      // can't drop same revisions
      if (
        !getRevisionsToDrop(draggedRevisions, dropChannel, pendingChannelMap)
          .length
      ) {
        return false;
      }

      return true;
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      item: monitor.getItem()
    })
  });

  return (
    <div ref={drop}>
      <ReleasesTableChannelRow
        risk={risk}
        branch={branch}
        revisions={revisions}
        isOverParent={isOver}
        item={item}
        canDrop={canDrop}
      />
    </div>
  );
};

ReleasesTableRow.propTypes = {
  // props
  risk: PropTypes.string.isRequired,
  branch: PropTypes.object,
  revisions: PropTypes.object,

  // state
  currentTrack: PropTypes.string.isRequired,
  pendingChannelMap: PropTypes.object,

  // actions
  promoteRevision: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    currentTrack: state.currentTrack,
    pendingChannelMap: getPendingChannelMap(state)
  };
};

const mapDispatchToProps = dispatch => {
  return {
    promoteRevision: (revision, targetChannel) =>
      dispatch(promoteRevision(revision, targetChannel))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesTableRow);
