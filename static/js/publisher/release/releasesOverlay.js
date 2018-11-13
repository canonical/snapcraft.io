import React, { Component } from "react";
import PropTypes from "prop-types";

import RevisionsList from "./revisionsList";

export default class ReleasesOverlay extends Component {
  render() {
    return (
      <div className="p-strip is-shallow">
        <div className="row">
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
  // actions
  selectRevision: PropTypes.func.isRequired,
  closeRevisionsList: PropTypes.func.isRequired,
  getReleaseHistory: PropTypes.func.isRequired
};
