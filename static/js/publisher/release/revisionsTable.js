import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

const RISKS = ['stable', 'candidate', 'beta', 'edge'];

export default class RevisionsTable extends Component {
  constructor() {
    super();

    this.state = {
      // default to latest track
      currentTrack: 'latest',
    };
  }

  getRevisionToDisplay(releasedChannels, nextReleases, channel, arch) {
    const pendingRelease = nextReleases[channel] && nextReleases[channel][arch];
    const currentRelease = releasedChannels[channel] && releasedChannels[channel][arch];

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
    const channel = `${track}/${risk}`;

    let canBePromoted = false;
    let thisRevision = this.getRevisionToDisplay(releasedChannels, nextChannelReleases, channel, arch);
    let thisPreviousRevision = releasedChannels[channel] && releasedChannels[channel][arch];

    // check for revision and pending release in target channel (risk - 1)
    let targetRisk = RISKS[RISKS.indexOf(risk) - 1];
    let targetRevision = null;
    let targetPreviousRevision = null;
    let targetHasPendingRelease = false;

    if (targetRisk) {
      const targetChannel = `${track}/${targetRisk}`;

      targetRevision = this.getRevisionToDisplay(releasedChannels, nextChannelReleases, targetChannel, arch);
      targetPreviousRevision = releasedChannels[targetChannel] && releasedChannels[targetChannel][arch];
      targetHasPendingRelease = (
        targetRevision && (!targetPreviousRevision || (targetPreviousRevision.revision !== targetRevision.revision))
      );
    }

    if (risk !== 'stable' && thisRevision && !targetHasPendingRelease &&
      (!targetRevision || targetRevision.revision !== thisRevision.revision)
    ) {
      canBePromoted = true;
    }

    // if feature is disabled don't show the buttons
    if (!this.props.options.releaseUiEnabled) {
      canBePromoted = false;
    }

    const hasPendingRelease = (
      thisRevision && (!thisPreviousRevision || (thisPreviousRevision.revision !== thisRevision.revision))
    );

    return (
      <td
        style={ { position: 'relative' } }
        key={`${channel}/${arch}`}
      >
        <span className="p-tooltip p-tooltip--btm-center">
          <span className="p-release-version">
            <span className={ hasPendingRelease ? 'p-previous-revision' : '' }>
              { thisPreviousRevision ? thisPreviousRevision.version : '-' }
            </span>
            { hasPendingRelease &&
              <span> &rarr; { thisRevision.version }</span>
            }
          </span>

          <span className="p-tooltip__message">
            { thisPreviousRevision ? `${thisPreviousRevision.version} (${thisPreviousRevision.revision})` : 'None' }
            { hasPendingRelease &&
              <span> &rarr; { `${thisRevision.version} (${thisRevision.revision})` }</span>
            }
          </span>
        </span>
        { (canBePromoted || hasPendingRelease) &&
          <div className="p-release-buttons">
            { canBePromoted &&
              <button className="p-icon-button" onClick={this.releaseClick.bind(this, thisRevision, track, risk)} title={`Promote ${thisRevision.version} (${thisRevision.revision})`}>&uarr;</button>
            }
            { hasPendingRelease &&
              <button className="p-icon-button" onClick={this.undoClick.bind(this, thisRevision, track, risk)} title={`Undo this release`}>&#x2715;</button>
            }
          </div>
        }
      </td>
    );
  }

  renderRows(releasedChannels, archs) {
    const nextChannelReleases = this.getNextReleasesData(releasedChannels, this.props.pendingReleases);
    const track = this.state.currentTrack;

    return RISKS.map(risk => {
      const channel = `${track}/${risk}`;

      return (
        <tr key={channel}>
          <td>{ channel }</td>
          {
            archs.map(arch => this.renderRevisionCell(track, risk, arch, releasedChannels, nextChannelReleases))
          }
        </tr>
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
              {
                tracks.map(track => <option key={`${track}`} value={track}>{ track }</option>)
              }
            </select>
          </div>
        </div>
      </form>
    );
  }

  renderReleasesConfirm() {
    const { pendingReleases } = this.props;
    const releasesCount = Object.keys(pendingReleases).length;

    const { isLoading } = this.props.fetchStatus;
    return (releasesCount > 0 &&
      <p>
        <span className="p-tooltip">
          <i className="p-icon--question" />
          {' '}
          { releasesCount } revision{ releasesCount > 1 ? 's' : '' } to release
          <span className="p-tooltip__message" role="tooltip" id="default-tooltip">
            { Object.keys(pendingReleases).map(revId => {
              const release = pendingReleases[revId];

              return <span key={revId}>
                {release.revision.version} ({release.revision.revision}) {release.revision.architectures.join(', ')}
                {' '}
                to {release.channels.join(', ')}
                {'\n'}
              </span>;
            })}
          </span>
        </span>
        {' '}
        <button className="p-button--positive is-inline" disabled={ isLoading } onClick={ this.onApplyClick.bind(this) }>{ isLoading ? 'Loading...' : 'Apply' }</button>
        <button className="p-button--neutral" onClick={ this.onRevertClick.bind(this) }>Cancel</button>
      </p>
    );
  }

  onTrackChange(event) {
    this.setState({ currentTrack: event.target.value });
  }

  getNextReleasesData(currentReleaseData, releases) {
    const nextReleaseData = JSON.parse(JSON.stringify(currentReleaseData));

    // for each release
    Object.keys(releases).forEach(releasedRevision => {
      releases[releasedRevision].channels.forEach(channel => {
        const revision = releases[releasedRevision].revision;

        if (!nextReleaseData[channel]) {
          nextReleaseData[channel] = {};
        }

        revision.architectures.forEach(arch => {
          nextReleaseData[channel][arch] = revision;
        });
      });
    });

    return nextReleaseData;
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
          { tracks.length > 1 && this.renderTrackDropdown(tracks) }
        </div>
        { this.renderReleasesConfirm() }
        <table className="p-release-table">
          <thead>
            <tr>
              <th width="22%" scope="col"></th>
              {
                archs.map(arch => <th width="13%" key={`${arch}`}>{ arch }</th>)
              }
            </tr>
          </thead>

          <tbody>
            { this.renderRows(releasedChannels, archs) }
          </tbody>
        </table>
      </Fragment>
    );
  }
}

RevisionsTable.propTypes = {
  releasedChannels: PropTypes.object.isRequired,
  pendingReleases: PropTypes.object.isRequired,
  archs: PropTypes.array.isRequired,
  tracks: PropTypes.array.isRequired,
  options: PropTypes.object.isRequired,
  releaseRevisions: PropTypes.func.isRequired,
  promoteRevision: PropTypes.func.isRequired,
  undoRelease: PropTypes.func.isRequired,
  clearPendingReleases: PropTypes.func.isRequired,
  fetchStatus: PropTypes.object.isRequired
};
