import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import {
  getArchitectures,
  getPendingChannelMap,
  hasPendingRelease,
  getBranches
} from "../selectors";
import ReleasesTableCell, {
  ReleasesTableRevisionCell
} from "./releasesTableCell";
import { useDragging, useDrop, DND_ITEM_REVISIONS } from "./dnd";

import { promoteChannel, promoteRevision } from "../actions/pendingReleases";
import { closeChannel } from "../actions/pendingCloses";

import { toggleBranches } from "../actions/branches";

import { AVAILABLE, STABLE, CANDIDATE } from "../constants";

import {
  getChannelName,
  isInDevmode,
  getRevisionsArchitectures
} from "../helpers";
import ReleasesTableChannelCell from "./releasesTableChannelCell";
import AvailableRevisionsMenu from "./availableRevisionsMenu";

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
    numberOfBranches,
    archs,
    pendingChannelMap,
    openBranches,
    availableBranches,
    isVisible,
    revisions
  } = props;

  if (!isVisible) {
    return null;
  }

  const branchName = branch ? branch.branch : null;

  const channel = getChannelName(currentTrack, risk, branchName);
  if (branch) {
    const parentChannel = getChannelName(currentTrack, risk);

    if (!openBranches || !openBranches.includes(parentChannel)) {
      return null;
    }
  }

  const rowRevisions = revisions || pendingChannelMap[channel];

  const canDrag = !(!rowRevisions || props.pendingCloses.includes(channel));

  const draggedRevisions = canDrag ? Object.values(rowRevisions) : [];

  const [isDragging, isGrabbing, drag, preview] = useDragging({
    item: {
      revisions: draggedRevisions,
      architectures: getRevisionsArchitectures(draggedRevisions),
      risk: props.risk,
      branch: props.branch ? props.branch.branch : null,
      type: DND_ITEM_REVISIONS
    },
    canDrag
  });

  const [{ isOver, canDrop, item }, drop] = useDrop({
    accept: DND_ITEM_REVISIONS,
    drop: item => {
      item.revisions.forEach(r => props.promoteRevision(r, channel));
    },
    canDrop: item => {
      const draggedRevisions = item.revisions;

      const { currentTrack, risk, branch, pendingChannelMap } = props;

      const branchName = branch ? branch.branch : null;

      const draggedChannel = getChannelName(
        currentTrack,
        item.risk,
        item.branch
      );
      const dropChannel = getChannelName(currentTrack, risk, branchName);

      // can't drop on 'available revisions row'
      if (props.risk === AVAILABLE) {
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

  return (
    <Fragment>
      {risk === AVAILABLE && (
        <h4>
          Revisions available to release from &nbsp;
          <form className="p-form p-form--inline">
            <AvailableRevisionsMenu />
          </form>
        </h4>
      )}

      <div ref={drop}>
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
                    isOver && canDrop && item.architectures.indexOf(arch) !== -1
                  }
                />
              )
          )}
        </div>
      </div>
    </Fragment>
  );
};

ReleasesTableRow.defaultProps = {
  isVisible: true
};

ReleasesTableRow.propTypes = {
  // props
  risk: PropTypes.string.isRequired,
  branch: PropTypes.object,
  numberOfBranches: PropTypes.number,
  availableBranches: PropTypes.array,
  isVisible: PropTypes.bool,

  revisions: PropTypes.object,

  // state
  currentTrack: PropTypes.string.isRequired,
  filters: PropTypes.object,
  pendingCloses: PropTypes.array.isRequired,

  archs: PropTypes.array.isRequired,
  pendingChannelMap: PropTypes.object,

  hasPendingRelease: PropTypes.func,

  openBranches: PropTypes.array,

  // actions
  closeChannel: PropTypes.func.isRequired,
  promoteChannel: PropTypes.func.isRequired,
  promoteRevision: PropTypes.func.isRequired,
  toggleBranches: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    currentTrack: state.currentTrack,
    filters: state.history.filters,
    pendingCloses: state.pendingCloses,
    archs: getArchitectures(state),
    pendingChannelMap: getPendingChannelMap(state),
    hasPendingRelease: (channel, arch) =>
      hasPendingRelease(state, channel, arch),
    openBranches: state.branches,
    availableBranches: getBranches(state)
  };
};

const mapDispatchToProps = dispatch => {
  return {
    promoteChannel: (channel, targetChannel) =>
      dispatch(promoteChannel(channel, targetChannel)),
    promoteRevision: (revision, targetChannel) =>
      dispatch(promoteRevision(revision, targetChannel)),
    closeChannel: channel => dispatch(closeChannel(channel)),
    toggleBranches: channel => dispatch(toggleBranches(channel))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesTableRow);
