import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import PromoteButton from './promoteButton';

const RISKS = ['stable', 'candidate', 'beta', 'edge'];

// TODO:
// - don't allow releasing multiple revisions into same arch/channel

export default class RevisionsList extends Component {
  renderRows(revisions) {
    return revisions.map((revision) => {
      const uploadDate = moment(revision.created_at);
      let canBeReleased = true;
      let hasPendingRelease = false;

      if (this.props.pendingReleases[revision.revision]) {
        hasPendingRelease = true;
        canBeReleased = false;
      }

      // TODO: disable channels revision is released to currently

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
                targetRisks={RISKS}
                promoteToChannel={this.onPromoteToChannel.bind(this, revision)}
              />
            }
            { hasPendingRelease &&
              <button className="p-icon-button p-tooltip p-tooltip--btm-center" onClick={this.undoClick.bind(this, revision)}>
                &#x2715;
                <span className="p-tooltip__message">Revert promoting this revision</span>
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

  isAlreadyReleased(revision) {
    return Object.keys(this.props.releasedChannels).some((channel) => {
      return Object.keys(this.props.releasedChannels[channel]).some((arch) => {
        return this.props.releasedChannels[channel][arch].revision === revision.revision;
      });
    });
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
  releasedChannels: PropTypes.object.isRequired,
  promoteRevision: PropTypes.func.isRequired,
  undoRelease: PropTypes.func.isRequired
};
