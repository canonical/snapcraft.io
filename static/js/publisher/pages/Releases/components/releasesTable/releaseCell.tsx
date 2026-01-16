import React from "react";
import { connect } from "react-redux";
import { AVAILABLE } from "../../constants";
import { getTrackingChannel } from "../../releasesState";

import HistoryIcon from "../historyIcon";
import { getChannelName, canBeReleased } from "../../helpers";
import { DND_ITEM_REVISIONS } from "../dnd";

import { toggleHistory } from "../../actions/history";
import { undoRelease } from "../../actions/pendingReleases";

import {
  getPendingChannelMap,
  getFilteredAvailableRevisionsForArch,
  getProgressiveState,
  hasPendingRelease,
} from "../../selectors";

import {
  ReleasesTableCellView,
  RevisionInfo,
  EmptyInfo,
  CloseChannelInfo,
  UnassignedInfo,
  FailedInfo,
} from "./cellViews";

import {
  ReleasesReduxState,
  DispatchFn,
  CPUArchitecture,
  ChannelArchitectureRevisionsMap,
  Channel,
  Revision,
  FailedRevision,
} from "../../../../types/releaseTypes";

// Type for branch object based on usage in the component
interface Branch {
  branch: string;
}

interface OwnProps {
  track: string;
  risk: string;
  arch: CPUArchitecture;
  branch?: Branch;
  isOverParent?: boolean;
  revision?: Revision; // Not used in the component logic, only in propTypes
  current?: string;
  showVersion?: boolean; // Not used in the component logic, only in propTypes
}

interface StateProps {
  channelMap: ChannelArchitectureRevisionsMap;
  filters: ReleasesReduxState["history"]["filters"];
  pendingCloses: Channel["name"][];
  failedRevisions: FailedRevision[];
  pendingChannelMap: ChannelArchitectureRevisionsMap;
  getAvailableCount: (arch: CPUArchitecture) => number;
  getProgressiveState: (
    channel: string,
    arch: CPUArchitecture,
    isPending: boolean,
  ) => [Revision | null, unknown]; // Returns tuple from selectors/index.ts getProgressiveState
  hasPendingRelease: (channel: string, arch: CPUArchitecture) => boolean;
}

interface DispatchProps {
  toggleHistoryPanel: (
    filters: ReleasesReduxState["history"]["filters"],
  ) => void;
  undoRelease: (revision: Revision, channel: string) => void;
}

type ReleasesTableReleaseCellProps = OwnProps & StateProps & DispatchProps;

// releases table cell with data from channel map release
const ReleasesTableReleaseCell = (props: ReleasesTableReleaseCellProps) => {
  const {
    track,
    risk,
    arch,
    branch,
    channelMap,
    pendingChannelMap,
    pendingCloses,
    filters,
    isOverParent,
    getAvailableCount,
    hasPendingRelease,
    undoRelease,
    toggleHistoryPanel,
    getProgressiveState,
    current,
    failedRevisions,
  } = props;
  const failed = !!failedRevisions.find(
    (rev) => rev.architecture === arch && rev.channel === `${track}/${risk}`,
  );
  const branchName = branch ? branch.branch : null;

  const channel = getChannelName(track, risk, branchName);

  // current revision to show from channel map (released or pending)
  const currentRevision =
    pendingChannelMap[channel] && pendingChannelMap[channel][arch];

  // check if there is a pending release in this cell
  const pendingRelease = hasPendingRelease(channel, arch);

  let previousRevision: Revision | null = null;
  let pendingProgressiveState: unknown = null;

  if (currentRevision) {
    [previousRevision, pendingProgressiveState] = getProgressiveState(
      channel,
      arch,
      pendingRelease,
    );
  }

  const isChannelPendingClose = pendingCloses.includes(channel);
  const isPending =
    pendingRelease || isChannelPendingClose || pendingProgressiveState;
  const isUnassigned = risk === AVAILABLE;
  const isActive =
    filters &&
    filters.arch === arch &&
    filters.risk === risk &&
    filters.branch === branchName;
  const isHighlighted = isPending || (isUnassigned && currentRevision);
  const releasable = canBeReleased(currentRevision);

  const canDrag = currentRevision && !isChannelPendingClose && releasable;

  const item = {
    revisions: [currentRevision],
    architectures: currentRevision ? currentRevision.architectures : [],
    risk,
    branch,
    type: DND_ITEM_REVISIONS,
  };

  function handleHistoryIconClick(
    arch: CPUArchitecture,
    risk: string,
    track: string,
    branchName: string | null,
  ) {
    window.scrollTo(0, 0);
    toggleHistoryPanel({ arch, risk, track, branch: branchName });
  }

  function undoClick(
    revision: Revision,
    channel: string,
    event: React.MouseEvent,
  ) {
    event.stopPropagation();
    undoRelease(revision, channel);
  }

  const className = [
    isUnassigned ? "is-unassigned" : "",
    isActive ? "is-active" : "",
    isHighlighted ? "is-highlighted" : "",
    isPending ? "is-pending" : "",
    isOverParent ? "is-over" : "",
    currentRevision?.changed && isUnassigned ? "current-change" : "",
  ].join(" ");

  const actionsNode = pendingRelease ? (
    <div className="p-release-buttons">
      <button
        className="p-action-button p-tooltip p-tooltip--btm-center"
        onClick={undoClick.bind(this, currentRevision, channel)}
      >
        <i className="p-icon--close" />
        <span className="p-tooltip__message">
          Cancel promoting this revision
        </span>
      </button>
    </div>
  ) : null;

  let cellInfoNode = null;

  if (isChannelPendingClose) {
    cellInfoNode = <CloseChannelInfo />;
  } else if (currentRevision) {
    cellInfoNode = (
      <RevisionInfo
        revision={currentRevision}
        isPending={pendingRelease ? true : false}
        previousRevision={previousRevision ? previousRevision : null}
        risk={risk}
        channel={channel}
      />
    );
  } else if (isUnassigned) {
    cellInfoNode = <UnassignedInfo availableCount={getAvailableCount(arch)} />;
  } else if (failed) {
    cellInfoNode = <FailedInfo />
  } else {
    cellInfoNode = (
      <EmptyInfo
        trackingChannel={getTrackingChannel(channelMap, track, risk, arch)}
      />
    );
  }

  const showHistoryIcon = currentRevision || isUnassigned;

  return (
    <ReleasesTableCellView
      actions={actionsNode}
      item={item}
      canDrag={canDrag}
      className={className}
      cellType="release"
      current={current}
      arch={arch}
    >
      {showHistoryIcon && (
        <HistoryIcon
          onClick={handleHistoryIconClick.bind(
            this,
            arch,
            risk,
            track,
            branchName,
          )}
        />
      )}
      {cellInfoNode}
    </ReleasesTableCellView>
  );
};

const mapStateToProps = (state: ReleasesReduxState): StateProps => {
  return {
    channelMap: state.channelMap,
    filters: state.history.filters,
    pendingCloses: state.pendingCloses,
    failedRevisions: state.failedRevisions,
    pendingChannelMap: getPendingChannelMap(state),
    getAvailableCount: (arch: CPUArchitecture) =>
      getFilteredAvailableRevisionsForArch(state, arch).length,
    getProgressiveState: (
      channel: string,
      arch: CPUArchitecture,
      isPending: boolean,
    ) => getProgressiveState(state, channel, arch, isPending),
    hasPendingRelease: (channel: string, arch: CPUArchitecture) =>
      hasPendingRelease(state, channel, arch),
  };
};

const mapDispatchToProps = (dispatch: DispatchFn): DispatchProps => {
  return {
    toggleHistoryPanel: (filters: ReleasesReduxState["history"]["filters"]) =>
      dispatch(toggleHistory(filters)),
    undoRelease: (revision: Revision, channel: string) =>
      dispatch(undoRelease(revision, channel)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ReleasesTableReleaseCell);
