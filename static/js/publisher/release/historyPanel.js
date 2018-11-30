import React, { Component } from "react";
import PropTypes from "prop-types";

import RevisionsList from "./revisionsList";

export default class HistoryPanel extends Component {
  render() {
    return (
      <div className="p-history-panel">
        <div className="p-strip is-shallow">
          <RevisionsList
            releases={this.props.releases}
            revisionsFilters={this.props.revisionsFilters}
            releasedChannels={this.props.releasedChannels}
            selectedRevisions={this.props.selectedRevisions}
            pendingReleases={this.props.pendingReleases}
            showChannels={this.props.showChannels}
            showArchitectures={this.props.showArchitectures}
            selectRevision={this.props.selectRevision}
            closeHistoryPanel={this.props.closeHistoryPanel}
          />
        </div>
      </div>
    );
  }
}

HistoryPanel.propTypes = {
  // state
  releases: PropTypes.array.isRequired,
  releasedChannels: PropTypes.object.isRequired,
  revisionsFilters: PropTypes.object,
  selectedRevisions: PropTypes.array.isRequired,
  pendingReleases: PropTypes.object.isRequired,
  showChannels: PropTypes.bool,
  showArchitectures: PropTypes.bool,
  // actions
  selectRevision: PropTypes.func.isRequired,
  closeHistoryPanel: PropTypes.func.isRequired
};
