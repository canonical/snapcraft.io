import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import {
  RISKS_WITH_AVAILABLE as RISKS,
  AVAILABLE,
  STABLE,
  BETA,
  EDGE
} from "./constants";
import { getArchitectures, getPendingChannelMap } from "./selectors";
import { isInDevmode } from "./devmodeIcon";
import ChannelMenu from "./components/channelMenu";
import PromoteMenu from "./components/promoteMenu";
import AvailableRevisionsMenu from "./components/availableRevisionsMenu";
import HistoryPanel from "./historyPanel";
import ReleasesTableCell from "./components/releasesTableCell";

import { promoteChannel } from "./actions/pendingReleases";
import { closeChannel } from "./actions/pendingCloses";

function getChannelName(track, risk) {
  return risk === AVAILABLE ? risk : `${track}/${risk}`;
}

class ReleasesTable extends Component {
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
          targetChannels[1].isDisabled = true;
        }
      }

      // filter out channels that have the same revisions already released
      targetChannels.forEach(targetChannel => {
        if (this.compareChannels(channel, targetChannel.channel)) {
          targetChannel.isDisabled = true;
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
      <Fragment key={channel}>
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
                  targetChannels={targetChannels}
                  promoteToChannel={this.onPromoteToChannel.bind(this, channel)}
                />
              )}
              {canBeClosed && (
                <ChannelMenu
                  channel={channel}
                  closeChannel={this.onCloseChannel.bind(this, channel)}
                />
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

  renderHistoryPanel() {
    return <HistoryPanel key="history-panel" />;
  }

  renderRows() {
    // rows can consist of a channel row or expanded history panel
    const rows = [];

    RISKS.forEach(risk => {
      rows.push(this.renderChannelRow(risk));
    });

    // if any channel is in current filters
    // inject history panel after that channel row
    if (
      this.props.isHistoryOpen &&
      this.props.filters &&
      this.props.filters.risk
    ) {
      const historyPanelRow = (
        <div className="p-releases-table__row" key="history-panel-row">
          <div className="p-releases-channel u-hide--small" />
          {this.renderHistoryPanel()}
        </div>
      );

      rows.splice(
        RISKS.indexOf(this.props.filters.risk) + 1,
        0,
        historyPanelRow
      );
    }

    return rows;
  }

  render() {
    const { archs } = this.props;
    const filteredArch = this.props.filters && this.props.filters.arch;
    return (
      <Fragment>
        <div className="row">
          <div
            className={`p-releases-table ${
              this.props.isHistoryOpen && this.props.filters ? "has-active" : ""
            }`}
          >
            <div className="p-releases-table__row p-releases-table__row--heading">
              <div className="p-releases-channel" />
              {archs.map(arch => (
                <div
                  className={`p-releases-table__cell p-releases-table__arch ${
                    filteredArch === arch ? "is-active" : ""
                  }`}
                  key={`${arch}`}
                >
                  {arch}
                </div>
              ))}
            </div>
            {this.renderRows()}
          </div>
        </div>
      </Fragment>
    );
  }
}

ReleasesTable.propTypes = {
  // state
  isHistoryOpen: PropTypes.bool,
  filters: PropTypes.object,
  channelMap: PropTypes.object.isRequired,
  pendingCloses: PropTypes.array.isRequired,

  archs: PropTypes.array.isRequired,
  pendingChannelMap: PropTypes.object,

  // actions
  closeChannel: PropTypes.func.isRequired,
  promoteChannel: PropTypes.func.isRequired,

  // state (non redux)
  currentTrack: PropTypes.string.isRequired
};

const mapStateToProps = state => {
  return {
    filters: state.history.filters,
    isHistoryOpen: state.history.isOpen,
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
)(ReleasesTable);
