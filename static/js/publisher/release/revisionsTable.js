import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

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

function getChannelName(track, risk) {
  return risk === UNASSIGNED ? risk : `${track}/${risk}`;
}

export default class RevisionsTable extends Component {
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

  undoClick(revision, track, risk) {
    this.props.undoRelease(revision, `${track}/${risk}`);
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
    const trackingChannel = this.props.getTrackingChannel(track, risk, arch);

    return (
      <div
        className="p-release-table__cell"
        style={{ position: "relative" }}
        key={`${channel}/${arch}`}
      >
        <span className="p-tooltip p-tooltip--btm-center">
          <span className="p-release-version">
            {thisPreviousRevision &&
              isInDevmode(thisPreviousRevision) &&
              !isPending && (
                <span className="p-revision-icon">
                  <DevmodeIcon
                    revision={thisPreviousRevision}
                    showTooltip={false}
                  />
                </span>
              )}
            <span className={isPending ? "p-previous-revision" : ""}>
              {thisPreviousRevision ? (
                <span className="p-revision-info">
                  {thisPreviousRevision.version}
                  <span className="p-revision-info__revision">
                    ({thisPreviousRevision.revision})
                  </span>
                </span>
              ) : (
                <span className={!isPending ? "p-revision-info--empty" : ""}>
                  {trackingChannel ? "↑" : "–"}
                </span>
              )}
            </span>
            {isPending && (
              <Fragment>
                {" "}
                &rarr;{" "}
                {hasPendingRelease ? (
                  <span className="p-revision-info is-pending">
                    {thisRevision.version}
                    <span className="p-revision-info__revision">
                      ({thisRevision.revision})
                    </span>
                  </span>
                ) : (
                  <em>close channel</em>
                )}
              </Fragment>
            )}
          </span>

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
        </span>
        {hasPendingRelease && (
          <div className="p-release-buttons">
            <button
              className="p-icon-button p-tooltip p-tooltip--btm-center"
              onClick={this.undoClick.bind(this, thisRevision, track, risk)}
            >
              &#x2715;
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

  renderRows(releasedChannels, archs) {
    const nextChannelReleases = this.props.getNextReleasedChannels();
    const track = this.props.currentTrack;

    return RISKS.map(risk => {
      const channel = getChannelName(track, risk);

      // don't show unassigned revisions until some are selected from the table
      // TODO: always show (when we can click on it)
      if (
        (risk === UNASSIGNED && !releasedChannels[channel]) ||
        (releasedChannels[channel] &&
          Object.keys(releasedChannels[channel]).length === 0)
      ) {
        return null;
      }

      let canBePromoted = true;
      let canBeClosed = true;

      if (risk === STABLE) {
        canBePromoted = false;
      }

      if (risk === UNASSIGNED) {
        canBeClosed = false;
      }

      if (!nextChannelReleases[channel]) {
        canBePromoted = false;
        canBeClosed = false;
      }

      if (this.props.pendingCloses.includes(channel)) {
        canBeClosed = false;
        canBePromoted = false;
      }

      let targetRisks = [];

      if (canBePromoted) {
        // take all risks above current one
        targetRisks = RISKS.slice(0, RISKS.indexOf(risk));

        // check for devmode revisions
        if (risk === EDGE || risk === BETA || risk === UNASSIGNED) {
          const hasDevmodeRevisions = Object.values(
            nextChannelReleases[channel]
          ).some(isInDevmode);

          // remove stable and beta channels as targets if any revision
          // is in devmode
          if (hasDevmodeRevisions) {
            targetRisks = targetRisks.slice(2);
          }
        }

        // filter out risks that have the same revisions already released
        targetRisks = targetRisks.filter(targetRisk => {
          return !this.compareChannels(channel, `${track}/${targetRisk}`);
        });

        if (targetRisks.length === 0) {
          canBePromoted = false;
        }
      }

      return (
        <div className="p-release-channel-row" key={channel}>
          <div className="p-release-channel-row__channel">
            <span className="p-release-channel-row__promote">
              {canBePromoted && (
                <PromoteButton
                  position="left"
                  track={track}
                  targetRisks={targetRisks}
                  promoteToChannel={this.onPromoteToChannel.bind(this, channel)}
                />
              )}
            </span>
            <span className="p-release-channel-row__name">
              {risk === UNASSIGNED ? <em>Unassigned revisions</em> : channel}
            </span>
            <span className="p-release-channel-row__menu">
              {canBeClosed && (
                <ChannelMenu
                  position="left"
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
    });
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
        <div className="p-release-confirm">
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
          <div className="p-release-confirm__buttons">
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
    const { releasedChannels, archs, tracks } = this.props;

    return (
      <Fragment>
        <div className="u-clearfix">
          <h4 className="u-float--left">Releases available for install</h4>
          {tracks.length > 1 && this.renderTrackDropdown(tracks)}
        </div>
        {this.renderReleasesConfirm()}
        <div className="p-release-table">
          <div className="p-release-channel-row">
            <div className="p-release-channel-row__channel" />
            {archs.map(arch => (
              <div
                className="p-release-table__cell p-release-table__arch"
                key={`${arch}`}
              >
                {arch}
              </div>
            ))}
          </div>
          {this.renderRows(releasedChannels, archs)}
        </div>
      </Fragment>
    );
  }
}

RevisionsTable.propTypes = {
  releasedChannels: PropTypes.object.isRequired,
  pendingReleases: PropTypes.object.isRequired,
  pendingCloses: PropTypes.array.isRequired,
  currentTrack: PropTypes.string.isRequired,
  archs: PropTypes.array.isRequired,
  tracks: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  getNextReleasedChannels: PropTypes.func.isRequired,
  setCurrentTrack: PropTypes.func.isRequired,
  releaseRevisions: PropTypes.func.isRequired,
  promoteRevision: PropTypes.func.isRequired,
  promoteChannel: PropTypes.func.isRequired,
  undoRelease: PropTypes.func.isRequired,
  clearPendingReleases: PropTypes.func.isRequired,
  closeChannel: PropTypes.func.isRequired,
  getTrackingChannel: PropTypes.func.isRequired
};
