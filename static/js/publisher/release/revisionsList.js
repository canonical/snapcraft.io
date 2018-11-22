import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import distanceInWords from "date-fns/distance_in_words_strict";
import format from "date-fns/format";

import DevmodeIcon from "./devmodeIcon";
import { UNASSIGNED } from "./constants";

import { getFilteredReleaseHistory } from "./releasesState";

export default class RevisionsList extends Component {
  revisionSelectChange(revision) {
    this.props.selectRevision(revision);
  }

  renderRows(revisions, isSelectable, showChannels) {
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
        isSelectable &&
        !isSelected &&
        revision.architectures.some(
          arch =>
            this.props.releasedChannels[UNASSIGNED] &&
            this.props.releasedChannels[UNASSIGNED][arch]
        );

      const id = `revision-check-${revision.revision}`;
      const className = `${isDisabled ? "is-disabled" : ""} ${
        isSelectable ? "is-clickable" : ""
      }`;

      return (
        <tr
          key={id}
          className={className}
          onClick={
            isSelectable ? this.revisionSelectChange.bind(this, revision) : null
          }
        >
          <td>
            {isSelectable ? (
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
          {showChannels && <td>{revision.channels.join(", ")}</td>}
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
    this.props.closeHistoryPanel();
  }

  render() {
    let { showChannels, showArchitectures } = this.props;
    let filteredRevisions = Object.values(this.props.revisionsMap).reverse();
    let title = "Latest revisions";
    let filters = this.props.revisionsFilters;
    let isReleaseHistory = false;

    if (filters && filters.arch) {
      title = `${title}: ${filters.arch}`;

      filteredRevisions = filteredRevisions.filter(revision => {
        return revision.architectures.includes(filters.arch);
      });

      if (filters.risk === UNASSIGNED) {
        // when listing 'unassigned' revisions show revisions with no channels
        showChannels = false;
        filteredRevisions = filteredRevisions.filter(revision => {
          return !revision.channels || revision.channels.length === 0;
        });
      } else {
        // when listing any other (real) channel, show filtered release history
        isReleaseHistory = true;
        title = `Releases history: ${filters.arch} – ${filters.track}/${
          filters.risk
        }`;

        filteredRevisions = getFilteredReleaseHistory(
          this.props.releases,
          this.props.revisionsMap,
          filters
        );
      }
    }

    const isNarrow = !showChannels && !showArchitectures;
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
        <table className={`p-revisions-list ${isNarrow ? "is-narrow" : ""}`}>
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
              {showArchitectures && (
                <th width="120px" scope="col">
                  Architecture
                </th>
              )}
              {showChannels && <th scope="col">Channels</th>}
              <th scope="col" width="130px" className="u-align--right">
                {isReleaseHistory ? "Release date" : "Submission date"}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRevisions.length > 0 ? (
              this.renderRows(
                filteredRevisions,
                !isReleaseHistory,
                showChannels
              )
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
  releases: PropTypes.array.isRequired,
  revisionsMap: PropTypes.object.isRequired,
  releasedChannels: PropTypes.object.isRequired,
  revisionsFilters: PropTypes.object,
  selectedRevisions: PropTypes.array.isRequired,
  showChannels: PropTypes.bool,
  showArchitectures: PropTypes.bool,
  // actions
  selectRevision: PropTypes.func.isRequired,
  closeHistoryPanel: PropTypes.func.isRequired
};
