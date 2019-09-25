import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { closeHistory } from "../actions/history";

import RevisionsList from "./revisionsList";
import ProgressiveReleaseInfo from "./progressiveReleaseInfo";

class HistoryPanel extends Component {
  onCloseClick(event) {
    event.preventDefault();
    this.props.closeHistoryPanel();
  }

  render() {
    return (
      <div className="p-history-panel">
        <a
          style={{ position: "absolute", right: 0, top: "2rem", zIndex: 1 }}
          href="#"
          onClick={this.onCloseClick.bind(this)}
          className="p-icon--close u-float-right"
        />
        <ProgressiveReleaseInfo />
        <div className="p-strip is-shallow">
          <RevisionsList />
        </div>
      </div>
    );
  }
}

HistoryPanel.propTypes = {
  closeHistoryPanel: PropTypes.func.isRequired
};

const mapDispatchToProps = dispatch => {
  return {
    closeHistoryPanel: () => dispatch(closeHistory())
  };
};

export default connect(
  null,
  mapDispatchToProps
)(HistoryPanel);
