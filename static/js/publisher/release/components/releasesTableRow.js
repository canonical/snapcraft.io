import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useDrop } from "react-dnd";

import {
  getArchitectures,
  getPendingChannelMap,
  hasPendingRelease
} from "../selectors";
import ReleasesTableCell from "./releasesTableCell";
import { useDragging, DND_ITEM_CHANNEL } from "./dnd";

import { promoteChannel } from "../actions/pendingReleases";
import { closeChannel } from "../actions/pendingCloses";

import {
  RISKS_WITH_AVAILABLE as RISKS,
  AVAILABLE,
  STABLE,
  CANDIDATE,
  BETA,
  EDGE
} from "../constants";

import { getChannelName, isInDevmode } from "../helpers";
import ChannelMenu from "./channelMenu";
import AvailableRevisionsMenu from "./availableRevisionsMenu";

const disabledBecauseDevmode = (
  <Fragment>
    Revisions with devmode confinement or devel grade <br />
    cannot be released to stable or candidate channels.
  </Fragment>
);

const disabledBecauseReleased = "The same revisions are already promoted.";

const disabledBecauseNotSelected = "Select some revisions to promote them.";

// TODO: move to selectors or helpers?
const compareChannels = (channelMap, channel, targetChannel) => {
  const channelArchs = channelMap[channel];
  const targetChannelArchs = channelMap[targetChannel];

  if (channelArchs) {
    return Object.keys(channelArchs).every(arch => {
      return (
        targetChannelArchs &&
        targetChannelArchs[arch] &&
        channelArchs[arch].revision === targetChannelArchs[arch].revision
      );
    });
  }

  return channelArchs === targetChannelArchs;
};

const ReleasesTableRow = props => {
  const { currentTrack, risk, archs, pendingChannelMap } = props;

  const draggedChannel = getChannelName(currentTrack, risk);
  const canDrag = !!pendingChannelMap[draggedChannel];
  const [isDragging, isGrabbing, drag, preview] = useDragging({
    item: { risk: props.risk, type: DND_ITEM_CHANNEL },
    canDrag
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: DND_ITEM_CHANNEL,
    drop: item => {
      props.promoteChannel(
        getChannelName(props.currentTrack, item.risk),
        getChannelName(props.currentTrack, props.risk)
      );
    },
    canDrop: item => {
      const { currentTrack, risk, pendingChannelMap } = props;

      const draggedChannel = getChannelName(currentTrack, item.risk);
      const dropChannel = getChannelName(currentTrack, risk);

      // can't drop on 'available revisions row'
      if (props.risk === AVAILABLE) {
        return false;
      }

      // can't drop on itself
      if (draggedChannel === dropChannel) {
        return false;
      }

      // can't drop if there is nothing in dragged channel
      if (!pendingChannelMap[draggedChannel]) {
        return false;
      }

      // can't drop devmode to stable/candidate
      if (risk === STABLE || risk === CANDIDATE) {
        const hasDevmodeRevisions = Object.values(
          pendingChannelMap[draggedChannel]
        ).some(isInDevmode);

        if (hasDevmodeRevisions) {
          return false;
        }
      }

      // can't drop same revisions
      if (compareChannels(pendingChannelMap, draggedChannel, dropChannel)) {
        return false;
      }

      return true;
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  const channel = getChannelName(currentTrack, risk);

  let canBePromoted = true;
  let canBeClosed = true;
  let promoteTooltip;

  if (risk === STABLE) {
    canBePromoted = false;
  }

  if (risk === AVAILABLE) {
    canBeClosed = false;
  }

  if (!pendingChannelMap[channel] || props.pendingCloses.includes(channel)) {
    canBePromoted = false;
    canBeClosed = false;
  }

  if (
    channel === AVAILABLE &&
    (!pendingChannelMap[channel] ||
      Object.keys(pendingChannelMap[channel]).length === 0)
  ) {
    promoteTooltip = disabledBecauseNotSelected;
  }

  let targetChannels = [];

  if (canBePromoted) {
    // take all risks above current one
    targetChannels = RISKS.slice(0, RISKS.indexOf(risk)).map(risk => {
      return { channel: getChannelName(currentTrack, risk) };
    });

    // check for devmode revisions
    if (risk === EDGE || risk === BETA || risk === AVAILABLE) {
      const hasDevmodeRevisions = Object.values(
        pendingChannelMap[channel]
      ).some(isInDevmode);

      // remove stable and beta channels as targets if any revision
      // is in devmode
      if (hasDevmodeRevisions) {
        targetChannels[0].isDisabled = true;
        targetChannels[0].reason = disabledBecauseDevmode;
        targetChannels[1].isDisabled = true;
        targetChannels[1].reason = disabledBecauseDevmode;
      }
    }

    // filter out channels that have the same revisions already released
    targetChannels.forEach(targetChannel => {
      if (compareChannels(pendingChannelMap, channel, targetChannel.channel)) {
        targetChannel.isDisabled = true;
        targetChannel.reason = disabledBecauseReleased;
      }
    });

    if (targetChannels.length === 0) {
      canBePromoted = false;
    }
  }

  const filteredChannel =
    props.filters && getChannelName(props.filters.track, props.filters.risk);

  let hasSameVersion = false;
  let channelVersion = "";
  let versionsMap = {};
  if (pendingChannelMap[channel]) {
    // calculate map of architectures for each version
    for (const arch in pendingChannelMap[channel]) {
      const version = pendingChannelMap[channel][arch].version;
      if (!versionsMap[version]) {
        versionsMap[version] = [];
      }
      versionsMap[version].push(arch);
    }

    hasSameVersion = Object.keys(versionsMap).length === 1;
    if (hasSameVersion) {
      channelVersion = Object.values(pendingChannelMap[channel])[0].version;
    } else {
      channelVersion = "Multiple versions";
    }
  }

  const channelVersionTooltip = (
    <Fragment>
      {Object.keys(versionsMap).map(version => {
        return (
          <span key={`tooltip-${channel}-${version}`}>
            {version}:{" "}
            <b>
              {versionsMap[version].length === archs.length
                ? "All architectures"
                : versionsMap[version].join(", ")}
            </b>
            <br />
          </span>
        );
      })}
    </Fragment>
  );

  const rowTitle = risk === AVAILABLE ? channelVersion : channel;

  const isHighlighted = archs.every(arch => {
    return props.hasPendingRelease(channel, arch);
  });

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
          className={`p-releases-table__row p-releases-table__row--channel p-releases-table__row--${risk} ${
            isDragging ? "is-dragging" : ""
          } ${isGrabbing ? "is-grabbing" : ""} ${
            canDrop && isOver ? "is-over" : ""
          } ${canDrop ? "can-drop" : ""}`}
        >
          <div
            ref={drag}
            className={`p-releases-channel ${
              filteredChannel === channel ? "is-active" : ""
            } ${isHighlighted ? "is-highlighted" : ""} ${
              canDrag ? "is-draggable" : ""
            }`}
          >
            <span className="p-releases__handle">
              <i className="p-icon--drag" />
            </span>
            <div className="p-releases-channel__name p-tooltip p-tooltip--btm-center">
              <span className="p-release-data__info">
                <span className="p-release-data__title">{rowTitle}</span>
                {risk !== AVAILABLE && (
                  <span className="p-release-data__meta">{channelVersion}</span>
                )}
                {channelVersion && (
                  <span className="p-tooltip__message">
                    {channelVersionTooltip}
                  </span>
                )}
              </span>
            </div>

            <span className="p-releases-table__menus">
              {(canBePromoted || canBeClosed) && (
                <ChannelMenu
                  tooltip={promoteTooltip}
                  targetChannels={targetChannels}
                  promoteToChannel={props.promoteChannel.bind(null, channel)}
                  channel={channel}
                  closeChannel={canBeClosed ? props.closeChannel : null}
                />
              )}
            </span>
          </div>
          {archs.map(arch => (
            <ReleasesTableCell
              key={`${currentTrack}/${risk}/${arch}`}
              track={currentTrack}
              risk={risk}
              arch={arch}
              showVersion={!hasSameVersion}
            />
          ))}
        </div>
      </div>
    </Fragment>
  );
};

ReleasesTableRow.propTypes = {
  // props
  risk: PropTypes.string.isRequired,

  // state
  currentTrack: PropTypes.string.isRequired,
  filters: PropTypes.object,
  pendingCloses: PropTypes.array.isRequired,

  archs: PropTypes.array.isRequired,
  pendingChannelMap: PropTypes.object,

  hasPendingRelease: PropTypes.func,

  // actions
  closeChannel: PropTypes.func.isRequired,
  promoteChannel: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    currentTrack: state.currentTrack,
    filters: state.history.filters,
    pendingCloses: state.pendingCloses,
    archs: getArchitectures(state),
    pendingChannelMap: getPendingChannelMap(state),
    hasPendingRelease: (channel, arch) =>
      hasPendingRelease(state, channel, arch)
  };
};

const mapDispatchToProps = dispatch => {
  return {
    promoteChannel: (channel, targetChannel) =>
      dispatch(promoteChannel(channel, targetChannel)),
    closeChannel: channel => dispatch(closeChannel(channel))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesTableRow);
