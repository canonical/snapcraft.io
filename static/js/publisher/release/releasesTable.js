import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import {
  RISKS_WITH_UNASSIGNED as RISKS,
  UNASSIGNED,
  STABLE,
  BETA,
  EDGE
} from "./constants";
import DevmodeIcon, { isInDevmode } from "./devmodeIcon";
import ChannelMenu from "./channelMenu";
import PromoteButton from "./promoteButton";
import HistoryPanel from "./historyPanel";

import { getTrackingChannel, getUnassignedRevisions } from "./releasesState";

function getChannelName(track, risk) {
  return risk === UNASSIGNED ? risk : `${track}/${risk}`;
}

class ReleasesTable extends Component {
  getRevisionToDisplay(releasedChannels, nextReleases, channel, arch) {
    const pendingRelease = nextReleases[channel] && nextReleases[channel][arch];
    const currentRelease =
      releasedChannels[channel] && releasedChannels[channel][arch];

    return pendingRelease || currentRelease;
  }

  releaseClick(revision, track, risk) {
    let targetRisk;
    targetRisk = RISKS[RISKS.indexOf(risk) - 1];
    if (targetRisk) {
      this.props.promoteRevision(revision, `${track}/${targetRisk}`);
    }
  }

  undoClick(revision, track, risk, event) {
    event.stopPropagation();
    this.props.undoRelease(revision, `${track}/${risk}`);
  }

  handleReleaseCellClick(arch, risk, track, event) {
    this.props.toggleHistoryPanel({ arch, risk, track });

    event.preventDefault();
    event.stopPropagation();
  }

  handleShowRevisionsClick(event) {
    this.props.toggleHistoryPanel();

    event.preventDefault();
    event.stopPropagation();
  }

  renderRevisionCell(track, risk, arch, releasedChannels, nextChannelReleases) {
    const channel = getChannelName(track, risk);

    let thisRevision = this.getRevisionToDisplay(
      releasedChannels,
      nextChannelReleases,
      channel,
      arch
    );
    let thisPreviousRevision =
      releasedChannels[channel] && releasedChannels[channel][arch];

    const hasPendingRelease =
      thisRevision &&
      (!thisPreviousRevision ||
        thisPreviousRevision.revision !== thisRevision.revision);

    const isChannelClosed = this.props.pendingCloses.includes(channel);
    const isPending = hasPendingRelease || isChannelClosed;
    const trackingChannel = getTrackingChannel(
      releasedChannels,
      track,
      risk,
      arch
    );

    const isUnassigned = risk === UNASSIGNED;
    const isActive =
      this.props.revisionsFilters &&
      this.props.revisionsFilters.arch === arch &&
      this.props.revisionsFilters.risk === risk;
    const isHighlighted = isPending || (isUnassigned && thisRevision);
    const className = `p-releases-table__cell is-clickable ${
      isUnassigned ? "is-unassigned" : ""
    } ${isActive ? "is-active" : ""} ${isHighlighted ? "is-highlighted" : ""}`;
    const unassignedCount = getUnassignedRevisions(this.props.revisions, arch)
      .length;

    return (
      <div
        className={className}
        key={`${channel}/${arch}`}
        onClick={this.handleReleaseCellClick.bind(this, arch, risk, track)}
      >
        <div className="p-tooltip p-tooltip--btm-center">
          <span className="p-release-data">
            {thisPreviousRevision &&
              isInDevmode(thisPreviousRevision) &&
              !isPending && (
                <span className="p-release-data__icon">
                  <DevmodeIcon
                    revision={thisPreviousRevision}
                    showTooltip={false}
                  />
                </span>
              )}

            {isPending ? (
              <Fragment>
                <span className="p-release-data__icon">&rarr;</span>
                {hasPendingRelease ? (
                  <span className="p-release-data__info is-pending">
                    <span className="p-release-data__version">
                      {thisRevision.version}
                    </span>
                    <span className="p-release-data__revision">
                      ({thisRevision.revision})
                    </span>
                  </span>
                ) : (
                  <em>close channel</em>
                )}
              </Fragment>
            ) : thisPreviousRevision ? (
              <span className="p-release-data__info">
                <span className="p-release-data__version">
                  {thisPreviousRevision.version}
                </span>
                <span className="p-release-data__revision">
                  ({thisPreviousRevision.revision})
                </span>
              </span>
            ) : isUnassigned ? (
              <Fragment>
                <span className="p-release-data__icon">
                  <i className="p-icon--plus" />
                </span>
                <span className="p-release-data__info">
                  <span className="p-release-data__version">Add revision</span>
                  <span className="p-release-data__revision">
                    {unassignedCount} available
                  </span>
                </span>
              </Fragment>
            ) : (
              <span className="p-release-data__info--empty">
                {trackingChannel ? "↑" : "–"}
              </span>
            )}
          </span>

          {(hasPendingRelease ||
            isChannelClosed ||
            trackingChannel ||
            (thisPreviousRevision && isInDevmode(thisPreviousRevision))) && (
            <span className="p-tooltip__message">
              {thisPreviousRevision
                ? `${thisPreviousRevision.version} (${
                    thisPreviousRevision.revision
                  })`
                : hasPendingRelease || !trackingChannel
                  ? "None"
                  : `Tracking channel ${trackingChannel}`}
              {hasPendingRelease && (
                <span>
                  {" "}
                  &rarr; {`${thisRevision.version} (${thisRevision.revision})`}
                </span>
              )}
              {isChannelClosed && (
                <span>
                  {" "}
                  &rarr; <em>close channel</em>
                </span>
              )}
              {thisPreviousRevision &&
                isInDevmode(thisPreviousRevision) && (
                  <Fragment>
                    <br />
                    {thisPreviousRevision.confinement === "devmode"
                      ? "confinement: devmode"
                      : "grade: devel"}
                  </Fragment>
                )}
            </span>
          )}
        </div>
        {hasPendingRelease && (
          <div className="p-release-buttons">
            <button
              className="p-action-button p-tooltip p-tooltip--btm-center"
              onClick={this.undoClick.bind(this, thisRevision, track, risk)}
            >
              <i className="p-icon--close" />
              <span className="p-tooltip__message">
                Cancel promoting this revision
              </span>
            </button>
          </div>
        )}
      </div>
    );
  }

  onPromoteToChannel(channel, targetChannel) {
    this.props.promoteChannel(channel, targetChannel);
  }

  onCloseChannel(channel) {
    this.props.closeChannel(channel);
  }

  compareChannels(channel, targetChannel) {
    const nextChannelReleases = this.props.getNextReleasedChannels();

    const channelArchs = nextChannelReleases[channel];
    const targetChannelArchs = nextChannelReleases[targetChannel];

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
    const releasedChannels = this.props.releasedChannels;
    const nextChannelReleases = this.props.getNextReleasedChannels();

    const channel = getChannelName(track, risk);

    let canBePromoted = true;
    let canBeClosed = true;

    if (risk === STABLE) {
      canBePromoted = false;
    }

    if (risk === UNASSIGNED) {
      canBeClosed = false;
    }

    if (
      !nextChannelReleases[channel] ||
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
      if (risk === EDGE || risk === BETA || risk === UNASSIGNED) {
        const hasDevmodeRevisions = Object.values(
          nextChannelReleases[channel]
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

    return (
      <div
        className={`p-releases-table__row p-releases-table__row--channel p-releases-table__row--${risk}`}
        key={channel}
      >
        <div className="p-releases-channel">
          <span className="p-releases-channel__name">
            {risk === UNASSIGNED ? <em>Unreleased revisions</em> : channel}
          </span>
          <span className="p-releases-table__menus">
            {canBePromoted && (
              <PromoteButton
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
            releasedChannels,
            nextChannelReleases
          )
        )}
      </div>
    );
  }

  renderHistoryPanel(showAllColumns) {
    return (
      <HistoryPanel
        key="history-panel"
        releases={this.props.releases}
        releasedChannels={this.props.releasedChannels}
        selectedRevisions={this.props.selectedRevisions}
        pendingReleases={this.props.pendingReleases}
        selectRevision={this.props.selectRevision}
        showArchitectures={!!showAllColumns}
        showChannels={!!showAllColumns}
      />
    );
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
      this.props.revisionsFilters &&
      this.props.revisionsFilters.risk
    ) {
      const historyPanelRow = (
        <div className="p-releases-table__row" key="history-panel-row">
          <div className="p-releases-channel u-hide--small" />
          {this.renderHistoryPanel(false)}
        </div>
      );

      rows.splice(
        RISKS.indexOf(this.props.revisionsFilters.risk) + 1,
        0,
        historyPanelRow
      );
    }

    return rows;
  }

  renderTrackDropdown(tracks) {
    return (
      <form className="p-form p-form--inline u-float--right">
        <div className="p-form__group">
          <label htmlFor="track-dropdown" className="p-form__label">
            Show revisions released in
          </label>
          <div className="p-form__control u-clearfix">
            <select
              id="track-dropdown"
              onChange={this.onTrackChange.bind(this)}
            >
              {tracks.map(track => (
                <option key={`${track}`} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    );
  }

  renderReleasesConfirm() {
    const { pendingReleases, pendingCloses, isLoading } = this.props;
    const releasesCount = Object.keys(pendingReleases).length;
    const closesCount = pendingCloses.length;

    return (
      (releasesCount > 0 || closesCount > 0) && (
        <div className="p-releases-confirm">
          <span className="p-tooltip">
            <i className="p-icon--question" />{" "}
            {releasesCount > 0 && (
              <span>
                {releasesCount} revision
                {releasesCount > 1 ? "s" : ""} to release.
              </span>
            )}{" "}
            {closesCount > 0 && (
              <span>
                {closesCount} channel
                {closesCount > 1 ? "s" : ""} to close.
              </span>
            )}
            <span
              className="p-tooltip__message"
              role="tooltip"
              id="default-tooltip"
            >
              {Object.keys(pendingReleases).map(revId => {
                const release = pendingReleases[revId];

                return (
                  <span key={revId}>
                    {release.revision.version} ({release.revision.revision}){" "}
                    {release.revision.architectures.join(", ")} to{" "}
                    {release.channels.join(", ")}
                    {"\n"}
                  </span>
                );
              })}
              {closesCount > 0 && (
                <span>Close channels: {pendingCloses.join(", ")}</span>
              )}
            </span>
          </span>{" "}
          <div className="p-releases-confirm__buttons">
            <button
              className="p-button--positive is-inline u-no-margin--bottom"
              disabled={isLoading}
              onClick={this.onApplyClick.bind(this)}
            >
              {isLoading ? "Loading..." : "Apply"}
            </button>
            <button
              className="p-button--neutral u-no-margin--bottom"
              onClick={this.onRevertClick.bind(this)}
            >
              Cancel
            </button>
          </div>
        </div>
      )
    );
  }

  onTrackChange(event) {
    this.props.setCurrentTrack(event.target.value);
  }

  onRevertClick() {
    this.props.clearPendingReleases();
  }

  onApplyClick() {
    this.props.releaseRevisions();
  }

  render() {
    const { archs, tracks } = this.props;
    const revisionsCount = Object.keys(this.props.revisions).length;

    return (
      <Fragment>
        <div className="row">
          <div className="u-clearfix">
            <h4 className="u-float--left">Releases available to install</h4>
            {tracks.length > 1 && this.renderTrackDropdown(tracks)}
          </div>
          {this.renderReleasesConfirm()}
          <div className="p-releases-table">
            <div className="p-releases-table__row p-releases-table__row--heading">
              <div className="p-releases-channel" />
              {archs.map(arch => (
                <div
                  className="p-releases-table__cell p-releases-table__arch"
                  key={`${arch}`}
                >
                  {arch}
                </div>
              ))}
            </div>
            {this.renderRows()}
          </div>
          <div className="p-release-actions">
            <a href="#" onClick={this.handleShowRevisionsClick.bind(this)}>
              Show all latest revisions ({revisionsCount})
            </a>
          </div>
          {this.props.isHistoryOpen &&
            !this.props.revisionsFilters &&
            this.renderHistoryPanel(true)}
        </div>
      </Fragment>
    );
  }
}

ReleasesTable.propTypes = {
  // state
  releases: PropTypes.array.isRequired,
  isHistoryOpen: PropTypes.bool,
  revisionsFilters: PropTypes.object,

  // state (non redux)
  revisions: PropTypes.object.isRequired,
  archs: PropTypes.array.isRequired,
  tracks: PropTypes.array.isRequired,
  currentTrack: PropTypes.string.isRequired,
  releasedChannels: PropTypes.object.isRequired,
  pendingReleases: PropTypes.object.isRequired,
  pendingCloses: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  selectedRevisions: PropTypes.array,

  // actions
  getNextReleasedChannels: PropTypes.func.isRequired,
  releaseRevisions: PropTypes.func.isRequired,
  setCurrentTrack: PropTypes.func.isRequired,
  promoteRevision: PropTypes.func.isRequired,
  promoteChannel: PropTypes.func.isRequired,
  undoRelease: PropTypes.func.isRequired,
  clearPendingReleases: PropTypes.func.isRequired,
  closeChannel: PropTypes.func.isRequired,
  toggleHistoryPanel: PropTypes.func.isRequired,
  selectRevision: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    revisionsFilters: state.history.filters,
    isHistoryOpen: state.history.isOpen,
    revisions: state.revisions
  };
};

export default connect(mapStateToProps)(ReleasesTable);
