import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

const RISKS = ['stable', 'candidate', 'beta', 'edge'];

export default class RevisionsTable extends Component {
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
    let targetChannel = null;

    if (targetRisk) {
      targetChannel = `${track}/${targetRisk}`;

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

    const hasPendingRelease = (
      thisRevision && (!thisPreviousRevision || (thisPreviousRevision.revision !== thisRevision.revision))
    );

    return (
      <td
        className="p-release-table__cell"
        style={ { position: 'relative' } }
        key={`${channel}/${arch}`}
      >
        <span className="p-tooltip p-tooltip--btm-center">
          <span className="p-release-version">
            <span className={ hasPendingRelease ? 'p-previous-revision' : '' }>
              { thisPreviousRevision ?
                <span className="p-revision-info">{thisPreviousRevision.version}
                  <span className="p-revision-info__revision">({thisPreviousRevision.revision})</span>
                </span> :
                '–'
              }
            </span>
            { hasPendingRelease &&
              <span>
                {' '}
                &rarr;
                {' '}
                <span className="p-revision-info">{thisRevision.version}
                  <span className="p-revision-info__revision">({thisRevision.revision})</span>
                </span>
              </span>
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
              <button className="p-icon-button p-tooltip p-tooltip--btm-center" onClick={this.releaseClick.bind(this, thisRevision, track, risk)}>
                &uarr;
                <span className="p-tooltip__message">{`Promote to ${targetChannel}`}</span>
              </button>
            }
            { hasPendingRelease &&
              <button className="p-icon-button p-tooltip p-tooltip--btm-center" onClick={this.undoClick.bind(this, thisRevision, track, risk)}>
                &#x2715;
                <span className="p-tooltip__message">Revert promoting this revision</span>
              </button>
            }
          </div>
        }
      </td>
    );
  }

  promoteChannelClick(channel, targetChannel, event) {
    this.props.promoteChannel(channel, targetChannel);
    this.closeAllDropdowns();
    event.preventDefault();
    event.stopPropagation();
  }

  dropdownButtonClick(event) {
    this.closeAllDropdowns();
    const controlId = event.target.closest('[aria-controls]').getAttribute('aria-controls');

    if (controlId) {
      const controlsEl = document.getElementById(controlId);
      controlsEl.setAttribute('aria-hidden', false);
    }

    event.stopPropagation();
  }

  closeAllDropdowns() {
    [].slice.call(document.querySelectorAll(".p-contextual-menu__dropdown")).forEach((dropdown) => {
      dropdown.setAttribute('aria-hidden', true);
    });
  }

  componentDidMount() {
    // use window instead of document, as React catches all events in document
    window.addEventListener('click', this.closeAllDropdowns);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.closeAllDropdowns);
  }

  renderRows(releasedChannels, archs) {
    const nextChannelReleases = this.props.getNextReleasedChannels();
    const track = this.props.currentTrack;

    return RISKS.map(risk => {
      const channel = `${track}/${risk}`;

      let canBePromoted = true;

      if (risk === 'stable') {
        canBePromoted = false;
      }

      if (!nextChannelReleases[channel]) {
        canBePromoted = false;
      }

      // TODO: show cell buttons only on hover
      const dropdownId = `promote-dropdown-${channel}`;
      return (
        <tr key={channel}>
          <td>
            <span className="p-channel-buttons">
              { canBePromoted &&
                <button
                  className="p-button--base p-icon-button p-contextual-menu--left"
                  aria-controls={dropdownId}
                  onClick={this.dropdownButtonClick.bind(this)}
                >
                  <i className="p-icon--contextual-menu"></i>
                  <span className="p-contextual-menu__dropdown" id={dropdownId} aria-hidden="true">
                    <span className="p-contextual-menu__group">
                      <span className="p-contextual-menu__item">Promote to:</span>
                      {
                        RISKS.map((targetRisk, i) => {
                          if (i < RISKS.indexOf(risk)) {
                            return (
                              <a
                                className="p-contextual-menu__link is-indented"
                                href="#"
                                key={`promote-to-${track}/${targetRisk}`}
                                onClick={this.promoteChannelClick.bind(this, channel, `${track}/${targetRisk}`)}
                              >
                                {`${track}/${targetRisk}`}
                              </a>
                            );
                          } else {
                            return null;
                          }
                        })
                      }
                    </span>
                  </span>
                </button>
              }
            </span>
            { channel }
          </td>
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
    const { pendingReleases, isLoading } = this.props;
    const releasesCount = Object.keys(pendingReleases).length;

    return (releasesCount > 0 &&
      <div className="p-release-confirm">
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
        <div className="p-release-confirm__buttons">
          <button className="p-button--positive is-inline u-no-margin--bottom" disabled={ isLoading } onClick={ this.onApplyClick.bind(this) }>{ isLoading ? 'Loading...' : 'Apply' }</button>
          <button className="p-button--neutral u-no-margin--bottom" onClick={ this.onRevertClick.bind(this) }>Cancel</button>
        </div>
      </div>
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
  currentTrack: PropTypes.string.isRequired,
  archs: PropTypes.array.isRequired,
  tracks: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  getNextReleasedChannels: PropTypes.func.isRequired,
  setCurrentTrack:  PropTypes.func.isRequired,
  releaseRevisions: PropTypes.func.isRequired,
  promoteRevision: PropTypes.func.isRequired,
  promoteChannel: PropTypes.func.isRequired,
  undoRelease: PropTypes.func.isRequired,
  clearPendingReleases: PropTypes.func.isRequired,
};
