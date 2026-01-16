/* eslint-disable */
import React, { Component, ReactNode } from "react";
import { connect } from "react-redux";

import Notification from "./notification";
import {
  AVAILABLE,
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_ALL,
} from "../constants";
import { getBuildId, getChannelName, isInDevmode } from "../helpers";
import type {
  Revision,
  ReleasesReduxState,
  DispatchFn,
  AvailableRevisionsSelect,
  PendingReleaseItem,
  CPUArchitecture,
  Channel,
} from "../../../types/releaseTypes";

import RevisionsListRow from "./revisionsListRow";
import { closeHistory } from "../actions/history";
import { toggleRevision } from "../actions/channelMap";
import {
  getFilteredReleaseHistory,
  getPendingChannelMap,
  getSelectedRevision,
  getSelectedRevisions,
  getSelectedArchitectures,
  getFilteredAvailableRevisions,
  getFilteredAvailableRevisionsForArch,
  isProgressiveReleaseEnabled,
  getPendingRelease,
} from "../selectors";
import { relative } from "@sentry/utils";

interface RevisionsListFilters {
  arch?: CPUArchitecture;
  risk?: string;
  track?: string;
  branch?: string | null;
}

interface OwnProps {
  // No own props - all props come from Redux
}

interface StateProps {
  revisions: { [revision: string]: Revision };
  filters: RevisionsListFilters | null;
  pendingReleases: { [revision: string]: { [channel: string]: PendingReleaseItem } };
  availableRevisionsSelect: AvailableRevisionsSelect;
  showChannels?: boolean;
  filteredReleaseHistory: Revision[];
  selectedRevisions: number[];
  selectedArchitectures: CPUArchitecture[];
  filteredAvailableRevisions: Revision[];
  getSelectedRevision: (arch: CPUArchitecture) => Revision | undefined;
  getFilteredAvailableRevisionsForArch: (arch: CPUArchitecture) => Revision[];
  pendingChannelMap: { [channel: string]: { [arch: string]: Revision } };
  isProgressiveReleaseEnabled?: boolean;
  getPendingRelease: (channel: Channel["name"], arch: CPUArchitecture) => PendingReleaseItem | null;
}

interface DispatchProps {
  closeHistoryPanel: () => void;
  toggleRevision: (revision: Revision) => void;
}

type RevisionsListProps = OwnProps & StateProps & DispatchProps;

interface RevisionsListState {
  [key: string]: boolean | undefined;
}

class RevisionsList extends Component<RevisionsListProps, RevisionsListState> {
  constructor(props: RevisionsListProps) {
    super(props);

    this.state = {};
  }

  selectVersionClick(revisions: Revision[]) {
    revisions.forEach((revision) => this.props.toggleRevision(revision));
  }

  renderRow(
    revision: Revision,
    releasedRevision: Revision | null,
    isSelectable: boolean,
    showChannels: boolean,
    isPending: boolean,
    isActive: boolean,
    showBuildRequest: boolean,
    progressiveBeingCancelled: boolean,
  ) {
    const rowKey = `revision-row-${revision.revision}-${
      revision.release ? revision.release.channel : new Date().getTime()
    }`;

    const risk = this.props.filters.risk;
    const track = this.props.filters.track;

    return (
      <RevisionsListRow
        key={rowKey}
        revision={revision}
        releasedRevision={releasedRevision}
        isSelectable={isSelectable}
        showChannels={showChannels}
        isPending={isPending}
        isActive={isActive}
        showBuildRequest={showBuildRequest}
        progressiveBeingCancelled={progressiveBeingCancelled}
      />
    );
  }

  // Moves the active revision to the top of the list
  getSortedRevisions(activeRevision: Revision | undefined, revisions: Revision[]) {
    const activeRevisionIndex = revisions.findIndex(
      (revision) =>
        activeRevision && revision.revision === activeRevision.revision,
    );

    let indexToMove = 1;
    const item = revisions.splice(activeRevisionIndex, indexToMove)[0];
    indexToMove = 0;
    revisions.splice(0, indexToMove, item);
    return revisions;
  }

  renderRows(
    revisions: Revision[],
    isSelectable: boolean,
    showChannels: boolean,
    activeRevision: Revision | undefined,
    showBuildRequest: boolean,
    progressiveReleaseBeingCancelled: PendingReleaseItem | null,
  ) {
    const sortedRevisions = this.getSortedRevisions(activeRevision, revisions);

    return sortedRevisions.map((revision, index) => {
      const isActive =
        activeRevision && revision.revision === activeRevision.revision;

      const progressiveBeingCancelled =
        progressiveReleaseBeingCancelled &&
        progressiveReleaseBeingCancelled.revision.revision === revision.revision
          ? true
          : false;

      let releasedRevision = sortedRevisions[index - 1];
      if (index !== 1 || !releasedRevision?.release?.isProgressive) {
        releasedRevision = null;
      }

      return this.renderRow(
        revision,
        releasedRevision,
        isSelectable,
        showChannels,
        false,
        isActive,
        showBuildRequest,
        progressiveBeingCancelled,
      );
    });
  }

  onCloseClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    this.props.closeHistoryPanel();
  }

  showAllRevisions(key: string) {
    this.setState({
      [key]: true,
    });
  }

  render() {
    let {
      availableRevisionsSelect,
      showChannels,
      filteredAvailableRevisions,
      pendingChannelMap,
      isProgressiveReleaseEnabled,
      getPendingRelease,
    } = this.props;
    let filteredRevisions = filteredAvailableRevisions;
    let title = "Latest revisions";
    let filters = this.props.filters;
    let isReleaseHistory = false;
    let pendingRelease = null;

    // selected revision in current architecture
    let selectedRevision;
    // list of revisions from other architectures that have same version (and are not selected yet)
    let selectedVersionRevisions = [];
    // list of architectures with revisions in selected version
    let selectedVersionRevisionsArchs = [];

    let key;
    let showAllRevisions = false;
    // TODO: is it still possible that filters will be null?
    if (filters && filters.arch) {
      if (filters.risk === AVAILABLE) {
        filteredRevisions = this.props.getFilteredAvailableRevisionsForArch(
          filters.arch,
        );

        if (availableRevisionsSelect === AVAILABLE_REVISIONS_SELECT_ALL) {
          title = (
            <>
              Latest revisions for <b>{filters.arch}</b>
            </>
          );
        } else if (
          availableRevisionsSelect === AVAILABLE_REVISIONS_SELECT_UNRELEASED
        ) {
          title = (
            <>
              Unreleased revisions for <b>{filters.arch}</b>
            </>
          );
        } else if (
          availableRevisionsSelect === AVAILABLE_REVISIONS_SELECT_RECENT
        ) {
          title = (
            <>
              Recent unreleased revisions for <b>{filters.arch}</b>
            </>
          );
        } else if (
          availableRevisionsSelect === AVAILABLE_REVISIONS_SELECT_LAUNCHPAD
        ) {
          title = (
            <>
              Revisions built on Launchpad for <b>{filters.arch}</b>
            </>
          );
        }
      } else {
        // when listing any other (real) channel, show filtered release history
        isReleaseHistory = true;
        title = (
          <>
            Releases history for <strong>{filters.arch}</strong> in{" "}
            <b>
              {filters.track}/{filters.risk}
              {filters.branch ? `/${filters.branch}` : ""}
            </b>
          </>
        );

        filteredRevisions = this.props.filteredReleaseHistory;

        pendingRelease = getPendingRelease(
          `${filters.track}/${filters.risk}`,
          filters.arch,
        );
      }

      selectedRevision = this.props.getSelectedRevision(filters.arch);
      if (selectedRevision) {
        // find all revisions with same version as selected revision
        // but only one (latest) per architecture
        filteredAvailableRevisions.forEach((revision) => {
          if (
            revision.version === selectedRevision.version &&
            revision.architectures.some(
              (arch) => selectedVersionRevisionsArchs.indexOf(arch) === -1,
            )
          ) {
            selectedVersionRevisions.push(revision);
            selectedVersionRevisionsArchs =
              selectedVersionRevisionsArchs.concat(revision.architectures);
          }
        });

        // filter out revisions that are already selected
        selectedVersionRevisions = selectedVersionRevisions.filter(
          (revision) =>
            this.props.selectedRevisions.indexOf(revision.revision) === -1,
        );

        // filter out current architecture
        selectedVersionRevisions = selectedVersionRevisions.filter(
          (revision) => revision.architectures.indexOf(filters.arch) === -1,
        );

        // recalculate list of architectures from current list of revisions
        selectedVersionRevisionsArchs = [];

        selectedVersionRevisions.forEach((revision) => {
          selectedVersionRevisionsArchs = selectedVersionRevisionsArchs.concat(
            revision.architectures,
          );
        });

        // make archs unique and sorted
        selectedVersionRevisionsArchs = selectedVersionRevisionsArchs
          .filter((item, i, ar) => ar.indexOf(item) === i)
          .sort();
      }

      key = `${filters.track}/${filters.risk}/${filters.arch}`;
      if (filters.risk === AVAILABLE) {
        key += `/${availableRevisionsSelect}`;
      }

      showAllRevisions = this.state[key];
    }

    const hasDevmodeRevisions = filteredRevisions.some(isInDevmode);

    let activeRevision = null;

    if (this.props.filters) {
      const activeChannel = getChannelName(filters.track, filters.risk);
      activeRevision = pendingChannelMap[activeChannel]
        ? pendingChannelMap[activeChannel][filters.arch]
        : null;
    }

    const showBuildRequest = filteredRevisions.some((revision) =>
      getBuildId(revision),
    );

    const showProgressiveReleases =
      isProgressiveReleaseEnabled && !showChannels;

    const progressiveReleaseBeingCancelled =
      isProgressiveReleaseEnabled && pendingRelease && pendingRelease.replaces;

    const showPendingRelease =
      pendingRelease &&
      filteredRevisions[0] &&
      !progressiveReleaseBeingCancelled &&
      pendingRelease.revision.revision !== filteredRevisions[0].revision;

    return (
      <>
        <button
          className="p-button--link u-no-margin--bottom u-hide--medium u-hide--large"
          onClick={this.onCloseClick.bind(this)}
          style={{ position: "relative" }}
        >
          &lsaquo;&nbsp;Releases
        </button>
        <div className="u-clearfix" style={{ position: "relative" }}>
          <p
            role="heading"
            aria-level="4"
            className="u-float-left p-heading--4"
          >
            {title}
          </p>
          <button
            style={{ marginTop: "0.5rem" }}
            onClick={this.onCloseClick.bind(this)}
            className="p-icon--close u-float-right p-button--link u-hide--small"
          />
        </div>
        {hasDevmodeRevisions && (
          <Notification>
            Revisions in development mode cannot be released to stable or
            candidate channels.
            <br />
            You can read more about{" "}
            <a href="/docs/snap-confinement">
              <code>devmode</code> confinement
            </a>{" "}
            and{" "}
            <a href="/docs/snapcraft-yaml-reference">
              <code>devel</code> grade
            </a>
            .
          </Notification>
        )}
        {!isReleaseHistory && selectedVersionRevisions.length > 0 && (
          <div className="p-releases-confirm">
            <b>{selectedRevision.version}</b> is available in{" "}
            <span className="p-tooltip">
              <span className="p-help">
                {selectedVersionRevisionsArchs.length} other architecture
                {selectedVersionRevisionsArchs.length > 1 ? "s" : ""}
              </span>
              <span className="p-tooltip__message" role="tooltip">
                {selectedVersionRevisionsArchs.join(", ")}
              </span>
            </span>
            <div className="p-releases-confirm__buttons">
              <button
                className="p-button--positive is-inline u-no-margin--bottom"
                onClick={this.selectVersionClick.bind(
                  this,
                  selectedVersionRevisions,
                )}
              >
                {"Select in available architectures"}
              </button>
            </div>
          </div>
        )}
        <table className="p-revisions-list p-table--mobile-card">
          <thead>
            <tr>
              <th
                className={!isReleaseHistory ? "col-checkbox-spacer" : ""}
                scope="col"
                style={{ width: "250px" }}
              >
                Revision
              </th>
              <th scope="col" style={{ width: "150px" }}>
                Version
              </th>
              {showBuildRequest && <th scope="col">Build Request</th>}
              {showProgressiveReleases && <th scope="col">Release progress</th>}
              {showChannels && <th scope="col">Channels</th>}
              <th scope="col" style={{ width: "180px" }}>
                {isReleaseHistory ? "Release date" : "Submission date"}
              </th>
            </tr>
          </thead>
          <tbody>
            {showPendingRelease &&
              this.renderRow(
                pendingRelease.revision,
                pendingRelease.previousReleases[0],
                !isReleaseHistory,
                showChannels,
                true,
                activeRevision.revision === pendingRelease.revision.revision,
                showBuildRequest,
                false,
              )}
            {filteredRevisions.length > 0 ? (
              this.renderRows(
                showAllRevisions
                  ? filteredRevisions
                  : filteredRevisions.slice(0, 5),
                !isReleaseHistory,
                showChannels,
                activeRevision,
                showBuildRequest,
                progressiveReleaseBeingCancelled,
              )
            ) : (
              <tr>
                <td colSpan="4">
                  <em>No releases</em>
                </td>
              </tr>
            )}
            {!showAllRevisions && filteredRevisions.length > 5 && (
              <tr className="p-revisions-list__row u-hide--medium u-hide--large">
                <td colSpan={5}>
                  Showing 5 of {filteredRevisions.length} revisions
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {!showAllRevisions && filteredRevisions.length > 5 && (
          <div
            className="u-align--right"
            style={{ position: "relative", zIndex: 1, paddingTop: "0.5rem" }}
          >
            <span
              className="u-hide--small"
              style={{ display: "inline-block", marginRight: "0.5rem" }}
            >
              Showing 5 of {filteredRevisions.length} revisions
            </span>

            <button
              className="p-button--link u-no-margin--bottom"
              onClick={this.showAllRevisions.bind(this, key)}
            >
              Show more
            </button>
          </div>
        )}
      </>
    );
  }
}

const mapStateToProps = (state: ReleasesReduxState): StateProps => {
  return {
    availableRevisionsSelect: state.availableRevisionsSelect,
    showChannels:
      !state.history.filters ||
      (state.history.filters &&
        state.history.filters.risk === AVAILABLE &&
        state.availableRevisionsSelect === AVAILABLE_REVISIONS_SELECT_ALL),
    filters: state.history.filters,
    revisions: state.revisions,
    pendingReleases: state.pendingReleases,
    pendingChannelMap: getPendingChannelMap(state),
    selectedRevisions: getSelectedRevisions(state),
    getSelectedRevision: (arch: CPUArchitecture) => getSelectedRevision(state, arch),
    filteredReleaseHistory: getFilteredReleaseHistory(state),
    selectedArchitectures: getSelectedArchitectures(state),
    filteredAvailableRevisions: getFilteredAvailableRevisions(state),
    getFilteredAvailableRevisionsForArch: (arch: CPUArchitecture) =>
      getFilteredAvailableRevisionsForArch(state, arch),
    isProgressiveReleaseEnabled: isProgressiveReleaseEnabled(state),
    getPendingRelease: (channel: Channel["name"], arch: CPUArchitecture) =>
      getPendingRelease(state, channel, arch),
  };
};

const mapDispatchToProps = (dispatch: DispatchFn): DispatchProps => {
  return {
    closeHistoryPanel: () => dispatch(closeHistory()),
    toggleRevision: (revision: Revision) => dispatch(toggleRevision(revision)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(RevisionsList);
