import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import PromoteButton from './promoteButton';

const RISKS = ['stable', 'candidate', 'beta', 'edge'];

// TODO:
// - don't allow releasing multiple revisions into same arch/channel

export default class RevisionsList extends Component {
  isRevisionReleased(revision, channel) {
    const releasedChannels = this.props.getNextReleasedChannels();

    const channelReleases = releasedChannels[channel];
    if (channelReleases) {
      return Object.keys(channelReleases).some((arch) => {
        return channelReleases[arch].revision === revision.revision;
      });
    }
    return false;
  }

  renderRows(revisions) {
    return revisions.map((revision) => {
      const uploadDate = moment(revision.created_at);
      let canBeReleased = true;
      let hasPendingRelease = false;

      const targetRisks = RISKS.filter((risk) => {
        return !this.isRevisionReleased(revision, `${this.props.currentTrack}/${risk}`);
      });

      if (targetRisks.length === 0) {
        canBeReleased = false;
      }

      if (!canBeReleased && this.props.pendingReleases[revision.revision]) {
        hasPendingRelease = true;
      }

      return (
        <tr key={revision.revision}>
          <td>{ revision.revision }</td>
          <td>{ revision.version }</td>
          <td>{ revision.architectures.join(", ") }</td>
          <td>{ revision.channels.join(", ") }</td>
          <td className="u-align--right">
            <span className="p-tooltip p-tooltip--btm-center" aria-describedby={`revision-uploaded-${revision.revision}`}>
              { uploadDate.fromNow() }
              <span className="p-tooltip__message u-align--center" role="tooltip" id={`revision-uploaded-${revision.revision}`}>
                { uploadDate.format("YYYY-MM-DD HH:mm") }
              </span>
            </span>
          </td>

          <td className="u-align--right">
            { canBeReleased &&
              <PromoteButton
                track={this.props.currentTrack}
                targetRisks={targetRisks}
                promoteToChannel={this.onPromoteToChannel.bind(this, revision)}
              />
            }
            { hasPendingRelease &&
              <button className="p-icon-button p-tooltip p-tooltip--btm-center" onClick={this.undoClick.bind(this, revision)}>
                &#x2715;
                <span className="p-tooltip__message">Cancel promoting this revision</span>
              </button>
            }
          </td>
        </tr>
      );
    });
  }

  onPromoteToChannel(revision, targetChannel) {
    this.props.promoteRevision(revision, targetChannel);
  }

  // TODO:
  // - undo doesn't work if release is in channel different then edge
  // - do it nicer?
  undoClick(revision) {
    this.props.undoRelease(revision, `${this.props.currentTrack}/edge`);
    this.props.undoRelease(revision, `${this.props.currentTrack}/beta`);
    this.props.undoRelease(revision, `${this.props.currentTrack}/candidate`);
    this.props.undoRelease(revision, `${this.props.currentTrack}/stable`);
  }



  render() {
    return (
      <Fragment>
        <h4>Revisions available</h4>
        <table>
          <thead>
            <tr>
              <th width="10%" scope="col">Revision</th>
              <th width="23%" scope="col">Version</th>
              <th width="12%" scope="col">Architecture</th>
              <th width="30%" scope="col">Channels</th>
              <th width="15%" scope="col" className="u-align--right">Submission date</th>
              <th width="10%" scope="col" className="u-align--right">Actions</th>
            </tr>
          </thead>

          <tbody>
            { this.renderRows(this.props.revisions) }
          </tbody>
        </table>
      </Fragment>
    );
  }
}

RevisionsList.propTypes = {
  currentTrack: PropTypes.string.isRequired,
  pendingReleases: PropTypes.object.isRequired,
  revisions: PropTypes.object.isRequired,
  getNextReleasedChannels: PropTypes.func.isRequired,
  promoteRevision: PropTypes.func.isRequired,
  undoRelease: PropTypes.func.isRequired
};
