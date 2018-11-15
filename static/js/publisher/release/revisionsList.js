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

  renderRows(revisions, isHistory) {
    return revisions.map(revision => {
      const revisionDate = revision.release
        ? new Date(revision.release.when)
        : new Date(revision.created_at);
      const isSelected = this.props.selectedRevisions.includes(
        revision.revision
      );

      // disable revisions from the same architecture that already selected
      // but only if checkboxes are visible (not in channel history)
      const isDisabled =
        isHistory &&
        !isSelected &&
        revision.architectures.some(
          arch =>
            this.props.releasedChannels[UNASSIGNED] &&
            this.props.releasedChannels[UNASSIGNED][arch]
        );

      const id = `revision-check-${revision.revision}`;
      const className = `${isDisabled ? "is-disabled" : ""} ${
        isHistory ? "is-clickable" : ""
      }`;

      return (
        <tr
          key={id}
          className={className}
          onClick={
            isHistory ? this.revisionSelectChange.bind(this, revision) : null
          }
        >
          <td>
            {isHistory ? (
              <Fragment>
                <input
                  type="checkbox"
                  checked={isSelected}
                  id={id}
                  onChange={this.revisionSelectChange.bind(this, revision)}
                />
                <label className="u-no-margin--bottom" htmlFor={id}>
                  {revision.revision}
                </label>
              </Fragment>
            ) : (
              <span>{revision.revision}</span>
            )}
          </td>
          <td>
            <DevmodeIcon revision={revision} showTooltip={true} />
          </td>
          <td>{revision.version}</td>
          {this.props.showArchitectures && (
            <td>{revision.architectures.join(", ")}</td>
          )}
          {this.props.showChannels && <td>{revision.channels.join(", ")}</td>}
          <td className="u-align--right">
            <span
              className="p-tooltip p-tooltip--btm-center"
              aria-describedby={`revision-uploaded-${revision.revision}`}
            >
              {distanceInWords(new Date(), revisionDate, { addSuffix: true })}
              <span
                className="p-tooltip__message u-align--center"
                role="tooltip"
                id={`revision-uploaded-${revision.revision}`}
              >
                {format(revisionDate, "YYYY-MM-DD HH:mm")}
              </span>
            </span>
          </td>
        </tr>
      );
    });
  }

  onCloseClick(event) {
    event.preventDefault();
    this.props.closeRevisionsList();
  }

  render() {
    let filteredRevisions = this.props.revisions;
    let title = "Revisions available";
    let filters = this.props.revisionsFilters;
    let isReleaseHistory = false;

    if (filters && filters.arch) {
      title = `Latest revisions: ${filters.arch}`;

      filteredRevisions = filteredRevisions.filter(revision => {
        return revision.architectures.includes(filters.arch);
      });

      if (filters.risk !== UNASSIGNED) {
        isReleaseHistory = true;
        title = `Releases history: ${filters.arch} – ${filters.track}/${
          filters.risk
        }`;

        filteredRevisions = this.props.getReleaseHistory(filters);
      }
    }

    return (
      <Fragment>
        <div>
          <h4 className="u-float--left">{title}</h4>
          <a
            style={{ marginTop: "0.5rem" }}
            href="#"
            onClick={this.onCloseClick.bind(this)}
            className="p-icon--close u-float--right"
          />
        </div>
        <table className="p-revisions-list">
          <thead>
            <tr>
              <th
                className={!isReleaseHistory ? "col-checkbox-spacer" : ""}
                width="100px"
                scope="col"
              >
                Revision
              </th>
              <th width="20px" />
              <th scope="col">Version</th>
              {this.props.showArchitectures && (
                <th scope="col">Architecture</th>
              )}
              {this.props.showChannels && <th scope="col">Channels</th>}
              <th scope="col" className="u-align--right">
                {isReleaseHistory ? "Release date" : "Submission date"}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRevisions.length > 0 ? (
              this.renderRows(filteredRevisions, !isReleaseHistory)
            ) : (
              <tr>
                <td colSpan="5">
                  <em>No releases</em>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Fragment>
    );
  }
}

RevisionsList.propTypes = {
  // state
  revisions: PropTypes.array.isRequired,
  releasedChannels: PropTypes.object.isRequired,
  revisionsFilters: PropTypes.object,
  selectedRevisions: PropTypes.array.isRequired,
  showChannels: PropTypes.bool,
  showArchitectures: PropTypes.bool,
  // actions
  selectRevision: PropTypes.func.isRequired,
  closeRevisionsList: PropTypes.func.isRequired,
  getReleaseHistory: PropTypes.func.isRequired
};
