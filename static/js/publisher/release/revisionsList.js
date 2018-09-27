import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import distanceInWords from 'date-fns/distance_in_words_strict';
import format from 'date-fns/format';

export default class RevisionsList extends Component {
  renderRows(revisions) {
    return revisions.map((revision) => {
      const uploadDate = new Date(revision.created_at);

      return (
        <tr key={revision.revision}>
          <td>{ revision.revision }</td>
          <td>{ revision.version }</td>
          <td>{ revision.architectures.join(", ") }</td>
          <td>{ revision.channels.join(", ") }</td>
          <td className="u-align--right">
            <span className="p-tooltip p-tooltip--btm-center" aria-describedby={`revision-uploaded-${revision.revision}`}>
              { distanceInWords(
                new Date(), 
                uploadDate, 
                { addSuffix: true }
              ) }
              <span className="p-tooltip__message u-align--center" role="tooltip" id={`revision-uploaded-${revision.revision}`}>
                { format(uploadDate, "YYYY-MM-DD HH:mm") }
              </span>
            </span>
          </td>
        </tr>
      );
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
  revisions: PropTypes.object.isRequired,
};
