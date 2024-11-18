import React, { Component } from "react";

import RevisionsList from "./revisionsList";

export default class HistoryPanel extends Component {
  render() {
    return (
      <div className="p-history-panel">
        <RevisionsList />
      </div>
    );
  }
}
