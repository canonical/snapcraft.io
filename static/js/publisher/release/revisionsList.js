import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import distanceInWords from "date-fns/distance_in_words_strict";
import format from "date-fns/format";

import DevmodeIcon from "./devmodeIcon";
import { UNASSIGNED } from "./constants";

export default class RevisionsList extends Component {
  revisionSelectChange(revision) {
    this.props.selectRevision(revision);
  }

  renderRows(revisions) {
    return revisions.map(revision => {
      const uploadDate = new Date(revision.created_at);
      const isSelected = this.props.selectedRevisions.includes(
        revision.revision
      );
      const isDisabled =
        !isSelected &&
        revision.architectures.some(
          arch =>
            this.props.releasedChannels[UNASSIGNED] &&
            this.props.releasedChannels[UNASSIGNED][arch]
        );

      return (
        <tr key={revision.revision} className={isDisabled ? "is-disabled" : ""}>
          <td>
            <input
              type="checkbox"
              checked={isSelected}
              id={`revision-check-${revision.revision}`}
              onChange={this.revisionSelectChange.bind(this, revision)}
            />
            <label
              className="u-no-margin--bottom"
              htmlFor={`revision-check-${revision.revision}`}
            >
              {revision.revision}
            </label>
          </td>
          <td>
            <DevmodeIcon revision={revision} showTooltip={true} />
          </td>
          <td>{revision.version}</td>
          <td>{revision.architectures.join(", ")}</td>
          <td>{revision.channels.join(", ")}</td>
          <td className="u-align--right">
            <span
              className="p-tooltip p-tooltip--btm-center"
              aria-describedby={`revision-uploaded-${revision.revision}`}
            >
              {distanceInWords(new Date(), uploadDate, { addSuffix: true })}
              <span
                className="p-tooltip__message u-align--center"
                role="tooltip"
                id={`revision-uploaded-${revision.revision}`}
              >
                {format(uploadDate, "YYYY-MM-DD HH:mm")}
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
        <table className="p-revisions-list">
          <thead>
            <tr>
              <th className="col-has-checkbox" width="10%" scope="col">
                Revision
              </th>
              <th width="20px" />
              <th width="23%" scope="col">
                Version
              </th>
              <th width="12%" scope="col">
                Architecture
              </th>
              <th width="30%" scope="col">
                Channels
              </th>
              <th width="15%" scope="col" className="u-align--right">
                Submission date
              </th>
            </tr>
          </thead>

          <tbody>{this.renderRows(this.props.revisions)}</tbody>
        </table>
      </Fragment>
    );
  }
}

RevisionsList.propTypes = {
  revisions: PropTypes.object.isRequired,
  selectedRevisions: PropTypes.array.isRequired,
  releasedChannels: PropTypes.object.isRequired,
  selectRevision: PropTypes.func.isRequired
};
