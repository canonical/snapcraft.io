import React, { Component } from "react";
import PropTypes from "prop-types";

import RevisionsList from "./revisionsList";

export default class ReleasesOverlay extends Component {
  render() {
    // body height in DOM is 100% of window height instead of content height
    // because of `sticky footer`, so we need to figure out where content ends
    // by finding a bottom of the footer
    const footerEl = document.querySelector("footer");
    const bodyHeight = footerEl.offsetTop + footerEl.clientHeight;
    const overlayHeight = bodyHeight - this.props.releasesOverlayTop;

    return (
      <div
        className="p-release-overlay"
        style={{
          top: this.props.releasesOverlayTop,
          minHeight: overlayHeight
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
