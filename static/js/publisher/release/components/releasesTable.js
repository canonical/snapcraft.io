import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { RISKS_WITH_AVAILABLE as RISKS } from "../constants";
import { getArchitectures, getBranches } from "../selectors";
import HistoryPanel from "./historyPanel";
import ReleasesTableRow from "./releasesTableRow";

class ReleasesTable extends Component {
  renderChannelRow(risk, branch) {
    let rowKey = risk;
    if (branch) {
      rowKey += `-${branch}`;
    }
    return <ReleasesTableRow key={rowKey} risk={risk} branch={branch} />;
  }

  renderHistoryPanel() {
    return <HistoryPanel key="history-panel" />;
  }

  renderRows() {
    const { branches } = this.props;
    // rows can consist of a channel row or expanded history panel
    const rows = [];

    RISKS.forEach(risk => {
      rows.push(this.renderChannelRow(risk));
      branches.filter(branch => branch.risk === risk).forEach(branch => {
        rows.push(this.renderChannelRow(risk, branch.branch));
      });
    });

    // if any channel is in current filters
    // inject history panel after that channel row
    if (
      this.props.isHistoryOpen &&
      this.props.filters &&
      this.props.filters.risk
    ) {
      const historyPanelRow = (
        <div className="p-releases-table__row" key="history-panel-row">
          <div className="p-releases-channel is-placeholder u-hide--small" />
          {this.renderHistoryPanel()}
        </div>
      );

      rows.splice(
        RISKS.indexOf(this.props.filters.risk) + 1,
        0,
        historyPanelRow
      );
    }

    return rows;
  }

  render() {
    const { archs } = this.props;
    const filteredArch = this.props.filters && this.props.filters.arch;

    const className = `p-releases-table ${
      this.props.isHistoryOpen && this.props.filters ? "has-active" : ""
    }`;

    return (
      <div className="row">
        <div className={className}>
          <div className="p-releases-table__row p-releases-table__row--heading">
            <div className="p-releases-channel is-placeholder" />
            {archs.map(arch => (
              <div
                className={`p-releases-table__cell p-releases-table__arch ${
                  filteredArch === arch ? "is-active" : ""
                }`}
                key={`${arch}`}
              >
                {arch}
              </div>
            ))}
          </div>
          {this.renderRows()}
        </div>
      </div>
    );
  }
}

ReleasesTable.propTypes = {
  // state
  isHistoryOpen: PropTypes.bool,
  filters: PropTypes.object,
  archs: PropTypes.array.isRequired,
  branches: PropTypes.array.isRequired
};

const mapStateToProps = state => {
  return {
    filters: state.history.filters,
    isHistoryOpen: state.history.isOpen,
    archs: getArchitectures(state),
    branches: getBranches(state)
  };
};

export default connect(mapStateToProps)(ReleasesTable);
