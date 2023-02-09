import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import {
  BUILD,
  AVAILABLE,
  RISKS,
  AVAILABLE_REVISIONS_SELECT_ALL,
} from "../../constants";
import {
  getArchitectures,
  getBranches,
  getLaunchpadRevisions,
  getAllRevisions,
} from "../../selectors";
import { selectAvailableRevisions, closeHistory } from "../../actions";

import { getChannelName, getBuildId } from "../../helpers";
import HistoryPanel from "../historyPanel";
import ReleasesTableDroppableRow from "./droppableRow";
import ReleasesTableRevisionsRow from "./revisionsRow";

const MAX_BRANCHES = 5;
const MAX_BUILDS = 5;

class ReleasesTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showAllRisksBranches: [],
      showAllBuilds: false,
    };
  }

  componentDidMount() {
    this.props.selectAvailableRevisions(AVAILABLE_REVISIONS_SELECT_ALL);
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
      showAllRisksBranches: newList,
    });
  }

  handleToggleShowMoreBuilds() {
    const { showAllBuilds } = this.state;
    this.setState({
      showAllBuilds: !showAllBuilds,
    });
  }

  renderChannelRow(risk, branch) {
    let rowKey = risk;
    if (branch) {
      rowKey += `-${branch.branch}`;
    }

    return (
      <ReleasesTableDroppableRow key={rowKey} risk={risk} branch={branch} />
    );
  }

  renderBuildRow(revisions) {
    const rowKey = `${BUILD}-${getBuildId(Object.values(revisions)[0])}`;

    return (
      <ReleasesTableRevisionsRow
        key={rowKey}
        risk={BUILD}
        revisions={revisions}
        buildRequestId={getBuildId(Object.values(revisions)[0])}
      />
    );
  }

  renderHistoryPanel() {
    return (
      <div className="p-releases-table__row" key="history-panel-row">
        <HistoryPanel key="history-panel" />
      </div>
    );
  }

  renderAvailableRevisionsRow() {
    const { isHistoryOpen, filters } = this.props;

    return (
      <>
        {this.renderChannelRow(AVAILABLE)}
        {isHistoryOpen &&
          filters.risk === AVAILABLE &&
          this.renderHistoryPanel()}
      </>
    );
  }

  renderAvailableRevisions() {
    return (
      <>
        <h5>Promote from uploaded revisions</h5>

        {this.renderAvailableRevisionsRow()}
      </>
    );
  }

  renderLaunchpadBuilds() {
    const lpRevisions = this.props.launchpadRevisions;
    const { showAllBuilds } = this.state;

    const revisions = this.props.allRevisions;
    const revisionsMap = revisions.reduce((acc, item) => {
      const buildId = getBuildId(item);
      if (buildId) {
        if (!acc[buildId]) {
          acc[buildId] = [];
        }

        acc[buildId].push(item);
      }
      return acc;
    }, {});

    const builds = lpRevisions
      .map(getBuildId)
      .filter((item, i, ar) => ar.indexOf(item) === i)
      .map((buildId) => {
        const revs = revisionsMap[buildId];

        const revsMap = {};

        revs.forEach((r) => {
          r.architectures.forEach((arch) => {
            revsMap[arch] = r;
          });
        });

        return revsMap;
      });

    let buildsToShow = builds;

    if (!showAllBuilds) {
      buildsToShow = builds.slice(0, MAX_BUILDS);
    }

    if (builds.length) {
      return (
        <>
          {buildsToShow.map((revisions) => this.renderBuildRow(revisions))}
          {builds.length > MAX_BUILDS && (
            <div className="p-releases-table__row--show-all u-align--right">
              {!showAllBuilds && (
                <>
                  <small
                    className="u-text-muted"
                    style={{ marginRight: "0.5rem" }}
                  >
                    Showing {MAX_BUILDS} of {builds.length} builds
                  </small>
                  <button
                    onClick={this.handleToggleShowMoreBuilds.bind(this)}
                    className="p-button is-small"
                  >
                    Show all builds
                  </button>
                </>
              )}
              {showAllBuilds && (
                <button
                  className="p-button is-small"
                  onClick={this.handleToggleShowMoreBuilds.bind(this)}
                >
                  Show only {MAX_BUILDS} builds
                </button>
              )}
            </div>
          )}
        </>
      );
    }

    return null;
  }

  renderRows() {
    const {
      branches,
      isHistoryOpen,
      filters,
      openBranches,
      currentTrack,
    } = this.props;
    const { showAllRisksBranches } = this.state;

    // rows can consist of a channel row or expanded history panel
    const rows = [];

    RISKS.forEach((risk) => {
      const risksBranches = branches.filter((branch) => branch.risk === risk);
      const showAllBranches = showAllRisksBranches.includes(risk);
      const currentChannel = getChannelName(currentTrack, risk);
      const isBranchesPanelOpen = openBranches.includes(currentChannel);

      rows.push({
        data: {
          risk,
        },
        node: this.renderChannelRow(risk),
      });

      risksBranches.forEach((branch, i) => {
        const isVisible =
          isBranchesPanelOpen && (showAllBranches ? true : i < MAX_BRANCHES);

        if (isVisible) {
          rows.push({
            data: {
              risk: branch.risk,
              branch: branch.branch,
            },
            node: this.renderChannelRow(branch.risk, branch),
          });
        }
      });

      if (risksBranches.length > MAX_BRANCHES && isBranchesPanelOpen) {
        rows.push({
          data: {
            risk,
          },
          node: (
            <div
              key={`show-all-${risk}-branches`}
              className="p-releases-table__row--branch"
            >
              <div className="p-releases-table__row--show-all">
                <a onClick={this.handleToggleShowMoreBranches.bind(this, risk)}>
                  {!showAllBranches && (
                    <>Show all branches ({risksBranches.length})</>
                  )}
                  {showAllBranches && <>Show only {MAX_BRANCHES} branches</>}
                </a>
              </div>
            </div>
          ),
        });
      }
    });

    // if any channel is in current filters
    // inject history panel after that channel row
    if (isHistoryOpen && filters && filters.risk) {
      const historyPanelRow = {
        node: this.renderHistoryPanel(),
      };

      const rowIndex = rows.findIndex((r) => {
        if (filters.branch) {
          return (
            r.data.risk === filters.risk && r.data.branch === filters.branch
          );
        }
        return r.data.risk === filters.risk;
      });

      if (rowIndex > -1) {
        rows.splice(rowIndex + 1, 0, historyPanelRow);
      }
    }

    return rows.map((r) => r.node);
  }

  render() {
    const { archs, launchpadRevisions } = this.props;
    const filteredArch = this.props.filters && this.props.filters.arch;

    const className = `p-releases-table ${
      this.props.isHistoryOpen && this.props.filters ? "has-active" : ""
    }`;

    return (
      <div className="row">
        <div className={className}>
          <div className="p-releases-table__row p-releases-table__row--heading u-hide--small">
            <div className="p-releases-channel is-placeholder">Channel</div>
            {archs.map((arch) => (
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
          <div>{this.renderRows()}</div>
          <h4>Revisions available to release</h4>
          {this.renderAvailableRevisionsRow()}
          {launchpadRevisions.length > 0 && this.renderLaunchpadBuilds()}
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
  allRevisions: PropTypes.array,

  // actions
  selectAvailableRevisions: PropTypes.func,
  closeHistory: PropTypes.func,
};

const mapStateToProps = (state) => {
  return {
    filters: state.history.filters,
    isHistoryOpen: state.history.isOpen,
    archs: getArchitectures(state),
    branches: getBranches(state),
    openBranches: state.branches,
    currentTrack: state.currentTrack,
    launchpadRevisions: getLaunchpadRevisions(state),
    allRevisions: getAllRevisions(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    selectAvailableRevisions: (value) =>
      dispatch(selectAvailableRevisions(value)),
    closeHistory: () => dispatch(closeHistory()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ReleasesTable);
