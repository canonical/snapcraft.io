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
            revisionsMap={this.props.revisionsMap}
            revisionsFilters={this.props.revisionsFilters}
            releasedChannels={this.props.releasedChannels}
            selectedRevisions={this.props.selectedRevisions}
            selectRevision={this.props.selectRevision}
            showChannels={true}
            showArchitectures={this.props.showArchitectures}
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
  revisionsMap: PropTypes.object.isRequired,
  releasedChannels: PropTypes.object.isRequired,
  revisionsFilters: PropTypes.object,
  selectedRevisions: PropTypes.array.isRequired,
  showArchitectures: PropTypes.bool,
  // actions
  selectRevision: PropTypes.func.isRequired,
  closeHistoryPanel: PropTypes.func.isRequired
};
