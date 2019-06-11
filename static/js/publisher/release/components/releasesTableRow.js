import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { getArchitectures, getPendingChannelMap } from "../selectors";
import ReleasesTableCell from "./releasesTableCell";

import { promoteChannel } from "../actions/pendingReleases";
import { closeChannel } from "../actions/pendingCloses";

import {
  RISKS_WITH_AVAILABLE as RISKS,
  AVAILABLE,
  STABLE,
  BETA,
  EDGE
} from "../constants";

import { getChannelName, isInDevmode } from "../helpers";
import PromoteMenu from "./promoteMenu";
import AvailableRevisionsMenu from "./availableRevisionsMenu";

const disabledBecauseDevmode = (
  <Fragment>
    Revisions with devmode confinement or devel grade <br />
    cannot be released to stable or candidate channels.
  </Fragment>
);

const disabledBecauseReleased = "The same revisions are already promoted.";

const disabledBecauseNotSelected = "Select some revisions to promote them.";

class ReleasesTableRow extends Component {
  renderRevisionCell(track, risk, arch) {
    return (
      <ReleasesTableCell
        key={`${track}/${risk}/${arch}`}
        track={track}
        risk={risk}
        arch={arch}
        pendingCloses={this.props.pendingCloses}
      />
    );
  }

  onPromoteToChannel(channel, targetChannel) {
    this.props.promoteChannel(channel, targetChannel);
  }

  onCloseChannel(channel) {
    this.props.closeChannel(channel);
  }

  compareChannels(channel, targetChannel) {
    const channelMap = this.props.pendingChannelMap;

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
  }

  renderChannelRow(risk) {
    const track = this.props.currentTrack;
    const archs = this.props.archs;
    const channelMap = this.props.channelMap;
    const pendingChannelMap = this.props.pendingChannelMap;

    const channel = getChannelName(track, risk);

    let canBePromoted = true;
    let canBeClosed = true;
    let promoteTooltip;

    if (risk === STABLE) {
      canBePromoted = false;
    }

    if (risk === AVAILABLE) {
      canBeClosed = false;
    }

    if (
      !pendingChannelMap[channel] ||
      this.props.pendingCloses.includes(channel)
    ) {
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
        return { channel: getChannelName(track, risk) };
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
        if (this.compareChannels(channel, targetChannel.channel)) {
          targetChannel.isDisabled = true;
          targetChannel.reason = disabledBecauseReleased;
        }
      });

      if (targetChannels.length === 0) {
        canBePromoted = false;
      }
    }

    const channelName =
      risk === AVAILABLE ? <AvailableRevisionsMenu /> : channel;

    const filteredChannel =
      this.props.filters &&
      getChannelName(this.props.filters.track, this.props.filters.risk);

    return (
      <Fragment>
        {risk === AVAILABLE && <h4>Revisions available to promote</h4>}
        <div
          className={`p-releases-table__row p-releases-table__row--channel p-releases-table__row--${risk}`}
        >
          <div
            className={`p-releases-channel ${
              filteredChannel === channel ? "is-active" : ""
            }`}
          >
            <span className="p-releases-channel__name">{channelName}</span>
            <span className="p-releases-table__menus">
              {canBePromoted && (
                <PromoteMenu
                  tooltip={promoteTooltip}
                  targetChannels={targetChannels}
                  promoteToChannel={this.onPromoteToChannel.bind(this, channel)}
                />
              )}
              {canBeClosed && (
                <button
                  className="p-button--base p-icon-button u-no-margin"
                  onClick={this.onCloseChannel.bind(this, channel)}
                  title={`Close channel ${channel}`}
                >
                  <i className="p-icon--delete" />
                </button>
              )}
            </span>
          </div>
          {archs.map(arch =>
            this.renderRevisionCell(
              track,
              risk,
              arch,
              channelMap,
              pendingChannelMap
            )
          )}
        </div>
      </Fragment>
    );
  }

  render() {
    return this.renderChannelRow(this.props.risk);
  }
}

ReleasesTableRow.propTypes = {
  // props
  risk: PropTypes.string.isRequired,

  // state
  currentTrack: PropTypes.string.isRequired,
  filters: PropTypes.object,
  channelMap: PropTypes.object.isRequired,
  pendingCloses: PropTypes.array.isRequired,

  archs: PropTypes.array.isRequired,
  pendingChannelMap: PropTypes.object,

  // actions
  closeChannel: PropTypes.func.isRequired,
  promoteChannel: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    currentTrack: state.currentTrack,
    filters: state.history.filters,
    channelMap: state.channelMap,
    pendingCloses: state.pendingCloses,
    archs: getArchitectures(state),
    pendingChannelMap: getPendingChannelMap(state)
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
