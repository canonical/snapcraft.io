import React, { Component } from "react";
import PropTypes from "prop-types";

import RevisionsList from "./revisionsList";

export default class HistoryPanel extends Component {
  render() {
    return (
      <div className="p-history-panel">
        <div className="p-strip is-shallow">
          <RevisionsList
            pendingReleases={this.props.pendingReleases}
            showChannels={this.props.showChannels}
            showArchitectures={this.props.showArchitectures}
          />
        </div>
      </div>
    );
  }
}

HistoryPanel.propTypes = {
  // state
  pendingReleases: PropTypes.object.isRequired,
  showChannels: PropTypes.bool,
  showArchitectures: PropTypes.bool
};
