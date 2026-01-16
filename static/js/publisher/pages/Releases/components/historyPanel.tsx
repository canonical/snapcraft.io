import React, { Component } from "react";

import RevisionsList from "./revisionsList";

export default class HistoryPanel extends Component<Record<string, never>> {
  render() {
    return (
      <div className="p-history-panel">
        <RevisionsList />
      </div>
    );
  }
}
