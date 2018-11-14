import React, { Component } from "react";
import PropTypes from "prop-types";

import RevisionsList from "./revisionsList";

export default class ReleasesOverlay extends Component {
  render() {
    return (
      <div
        className="p-release-overlay"
        style={{
          top: this.props.releasesOverlayTop
        }}
      >
        <div className="row">
          <hr />
          <RevisionsList
            revisions={this.props.revisions}
            revisionsFilters={this.props.revisionsFilters}
            releasedChannels={this.props.releasedChannels}
            selectedRevisions={this.props.selectedRevisions}
            selectRevision={this.props.selectRevision}
            showChannels={true}
            showArchitectures={true}
            closeRevisionsList={this.props.closeRevisionsList}
            getReleaseHistory={this.props.getReleaseHistory}
          />
        </div>
      </div>
    );
  }
}

ReleasesOverlay.propTypes = {
  // state
  revisions: PropTypes.array.isRequired,
  releasedChannels: PropTypes.object.isRequired,
  revisionsFilters: PropTypes.object,
  selectedRevisions: PropTypes.array.isRequired,
  showChannels: PropTypes.bool,
  showArchitectures: PropTypes.bool,
  releasesOverlayTop: PropTypes.number,
  // actions
  selectRevision: PropTypes.func.isRequired,
  closeRevisionsList: PropTypes.func.isRequired,
  getReleaseHistory: PropTypes.func.isRequired
};
