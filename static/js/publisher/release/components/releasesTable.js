import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { BUILD, AVAILABLE, RISKS_WITH_AVAILABLE as RISKS } from "../constants";
import {
  getArchitectures,
  getBranches,
  getLaunchpadRevisions,
  getRevisionsFromBuild
} from "../selectors";
import { getBuildId } from "../helpers";
import HistoryPanel from "./historyPanel";
import ReleasesTableRow from "./releasesTableRow";
import AvailableRevisionsMenu from "./availableRevisionsMenu";

class ReleasesTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showAllRisksBranches: []
    };
  }

  handleToggleShowMoreBranches(risk) {
    const { showAllRisksBranches } = this.state;
    const newList = showAllRisksBranches.slice(0);

    if (!newList.includes(risk)) {
      newList.push(risk);
    } else {
      newList.splice(newList.indexOf(risk), 1);
    }

    this.setState({
      showAllRisksBranches: newList
    });
  }

  renderChannelRow(risk, branch, numberOfBranches, revisions) {
    let rowKey = risk;
    if (branch) {
      rowKey += `-${branch.branch}`;
    }

    if (risk === BUILD) {
      rowKey += `-${getBuildId(Object.values(revisions)[0])}`;
    }

    return (
      <ReleasesTableRow
        key={rowKey}
        risk={risk}
        branch={branch}
        numberOfBranches={numberOfBranches}
        revisions={revisions}
      />
    );
  }

  renderBuildRow(revisions) {
    return this.renderChannelRow(BUILD, null, 0, revisions);
  }

  renderHistoryPanel() {
    return <HistoryPanel key="history-panel" />;
  }

  renderRows() {
    const {
      branches,
      isHistoryOpen,
      filters,
      openBranches,
      currentTrack
    } = this.props;
    const { showAllRisksBranches } = this.state;

    const maxBranches = 10;

    // rows can consist of a channel row or expanded history panel
    const rows = [];

    RISKS.forEach(risk => {
      const risksBranches = branches.filter(branch => branch.risk === risk);
      const showAllBranches = showAllRisksBranches.includes(risk);

      rows.push({
        data: {
          risk
        },
        node: this.renderChannelRow(risk, null, risksBranches.length)
      });

      risksBranches.forEach((branch, i) => {
        const isVisible = showAllBranches ? true : i < maxBranches;

        if (isVisible) {
          rows.push({
            data: {
              risk: branch.risk,
              branch: branch.branch
            },
            node: this.renderChannelRow(branch.risk, branch, null)
          });
        }
      });

      const currentChannel = `${currentTrack}/${risk}`;

      if (
        risksBranches.length > maxBranches &&
        openBranches.includes(currentChannel)
      ) {
        rows.push({
          data: {
            risk
          },
          node: (
            <div
              key={`show-all-${risk}-branches`}
              className="p-releases-table__row--show-all"
            >
              <a onClick={this.handleToggleShowMoreBranches.bind(this, risk)}>
                {!showAllBranches && (
                  <Fragment>
                    Show all branches ({risksBranches.length})
                  </Fragment>
                )}
                {showAllBranches && (
                  <Fragment>Show only {maxBranches} branches</Fragment>
                )}
              </a>
            </div>
          )
        });
      }
    });

    // if any channel is in current filters
    // inject history panel after that channel row
    if (isHistoryOpen && filters && filters.risk) {
      const historyPanelRow = {
        node: (
          <div className="p-releases-table__row" key="history-panel-row">
            <div className="p-releases-channel is-placeholder u-hide--small" />
            {this.renderHistoryPanel()}
          </div>
        )
      };

      const rowIndex = rows.findIndex(r => {
        if (filters.branch) {
          return (
            r.data.risk === filters.risk && r.data.branch === filters.branch
          );
        }
        return r.data.risk === filters.risk;
      });

      rows.splice(rowIndex + 1, 0, historyPanelRow);
    }

    // inject heading before 'Available' channel
    const availableHeading = {
      node: (
        <h4 key="available-revisions-heading">
          Revisions available to release from &nbsp;
          <form className="p-form p-form--inline">
            <AvailableRevisionsMenu />
          </form>
        </h4>
      )
    };

    const availableRowIndex = rows.findIndex(r => r.data.risk === AVAILABLE);
    rows.splice(availableRowIndex, 0, availableHeading);

    return rows.map(r => r.node);
  }

  render() {
    const { archs } = this.props;
    const filteredArch = this.props.filters && this.props.filters.arch;

    const className = `p-releases-table ${
      this.props.isHistoryOpen && this.props.filters ? "has-active" : ""
    }`;

    const lpRevisions = this.props.launchpadRevisions;

    const builds = lpRevisions
      .map(getBuildId)
      .filter((item, i, ar) => ar.indexOf(item) === i)
      .map(buildId => {
        const revs = this.props.getRevisionsFromBuild(buildId);

        const revsMap = {};

        revs.forEach(r => {
          r.architectures.forEach(arch => {
            revsMap[arch] = r;
          });
        });

        return revsMap;
      });

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

          {!!builds.length && <h4>Revisions built on Launchpad</h4>}
          {builds.map(revisions => this.renderBuildRow(revisions))}
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
  branches: PropTypes.array.isRequired,
  openBranches: PropTypes.array.isRequired,
  currentTrack: PropTypes.string.isRequired,

  launchpadRevisions: PropTypes.array,
  getRevisionsFromBuild: PropTypes.func
};

const mapStateToProps = state => {
  return {
    filters: state.history.filters,
    isHistoryOpen: state.history.isOpen,
    archs: getArchitectures(state),
    branches: getBranches(state),
    openBranches: state.branches,
    currentTrack: state.currentTrack,
    launchpadRevisions: getLaunchpadRevisions(state),
    getRevisionsFromBuild: buildId => getRevisionsFromBuild(state, buildId)
  };
};

export default connect(mapStateToProps)(ReleasesTable);
