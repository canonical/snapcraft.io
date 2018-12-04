import React, { Component } from "react";
import PropTypes from "prop-types";

import RevisionsList from "./revisionsList";

export default class HistoryPanel extends Component {
  render() {
    return (
      <div className="p-history-panel">
        <div className="p-strip is-shallow">
          <RevisionsList pendingReleases={this.props.pendingReleases} />
        </div>
      </div>
    );
  }
}

HistoryPanel.propTypes = {
  // state (non-redux)
  pendingReleases: PropTypes.object.isRequired
};
