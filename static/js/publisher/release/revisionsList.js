import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

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

      if (this.isAlreadyReleased(revision)) {
        canBeReleased = false;
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
              <button className="p-icon-button p-tooltip p-tooltip--btm-center" onClick={this.releaseClick.bind(this, revision)}>
                &uarr;
                <span className="p-tooltip__message">{`Promote to ${this.props.currentTrack}/edge`}</span>
              </button>
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

  releaseClick(revision) {
    this.props.promoteRevision(revision, `${this.props.currentTrack}/edge`);
  }

  undoClick(revision) {
    this.props.undoRelease(revision, `${this.props.currentTrack}/edge`);
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
              <th width="10%" scope="col" className="u-align--right">Release</th>
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
