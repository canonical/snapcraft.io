import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

export default class RevisionsList extends Component {
  renderRows(revisions) {
    return revisions.map((revision) => {
      const uploadDate = moment(revision.timestamp);

      return (
        <tr key={revision.revision}>
          <td>#{ revision.revision }</td>
          <td>{ revision.version }</td>
          <td>{ revision.arch }</td>
          <td>{ revision.channels.join(", ") }</td>
          <td>{ uploadDate.format("YYYY-MM-DD HH:mm") }</td>
          <td className="u-align--right">{ uploadDate.fromNow() }</td>
        </tr>
      );
    });
  }

  render() {
    return (
      <table>
        <thead>
          <tr>
            <th width="10%" scope="col">Revision</th>
            <th width="15%" scope="col">Version</th>
            <th width="15%" scope="col">Architecture</th>
            <th width="30%" scope="col">Channels</th>
            <th width="30%" scope="col" colSpan="2">Submission date</th>
          </tr>
        </thead>

        <tbody>
          { this.renderRows(this.props.revisions) }
        </tbody>
      </table>
    );
  }
}

RevisionsList.propTypes = {
  revisions: PropTypes.object.isRequired
};
