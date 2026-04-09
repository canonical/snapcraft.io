import { Fragment } from "react";
import { connect } from "react-redux";
import { format, formatDistanceToNow } from "date-fns";
import { sortChannels } from "../../../../../libs/channels";
import {
  getPendingChannelMap,
  getBranches,
  type Branch,
} from "../../selectors";
import { Handle } from "../dnd";
import { closeChannel, promoteRevision } from "../../slices/pendingChanges";
import { toggleBranches } from "../../slices/branches";
import {
  RISKS_WITH_AVAILABLE as RISKS,
  AVAILABLE,
  BUILD,
  STABLE,
  CANDIDATE,
  BETA,
  EDGE,
} from "../../constants";
import {
  getChannelName,
  isInDevmode,
  canBeReleased,
  getLatestRelease,
} from "../../helpers";
import ChannelMenu from "../channelMenu";
import { triggerGAEvent } from "../../analytics";
import type {
  ArchitectureRevisionsMap,
  ChannelArchitectureRevisionsMap,
  HistoryFilters,
  ReleasesReduxState,
  Revision,
  TargetChannel
} from "../../../../types/releaseTypes";
import type { AppDispatch } from "../../store";

const disabledBecauseDevmode = (
  <Fragment>
    Revisions with devmode confinement or devel grade <br />
    cannot be released to stable or candidate channels.
  </Fragment>
);

const disabledBecauseReleased = <>"The same revisions are already promoted."</>;

const disabledBecauseNotSelected = <>"Select some revisions to promote them."</>;

const canReleaseToChannel = (
  currentRevisionsByArch: ArchitectureRevisionsMap,
  targetRevisionsByArch: ArchitectureRevisionsMap,
  targetChannel: string,
) => {
  if (currentRevisionsByArch) {
    return Object.keys(currentRevisionsByArch).some((arch) => {
      if (!targetRevisionsByArch?.[arch]) {
        return true; // no target revision for this arch, can release
      }
      const isProgressiveRelease = getLatestRelease(
        targetRevisionsByArch[arch],
        targetChannel,
      )?.isProgressive;

      return currentRevisionsByArch[arch] && (
        currentRevisionsByArch[arch].revision !==
          targetRevisionsByArch[arch].revision || isProgressiveRelease
      );
    });
  }

  return currentRevisionsByArch === targetRevisionsByArch;
};

interface OwnProps {
  risk: string;
  branch?: Branch;
  drag: any;
  revisions: ArchitectureRevisionsMap;
}

interface StateProps {
  availableBranches: Branch[];
  numberOfBranches: number | null;
  currentTrack: string;
  filters: HistoryFilters | null;
  pendingCloses: string[];
  pendingChannelMap: ChannelArchitectureRevisionsMap;
  openBranches: string[];
}

interface DispatchProps {
  promoteRevision: (revision: Revision, targetChannel: string) => void;
  closeChannel: (channel: string) => void;
  toggleBranches: (channel: string) => void;
  triggerGAEvent: (...eventProps: Parameters<typeof triggerGAEvent>) => void;
}

type ReleasesTableChannelHeadingProps = OwnProps & StateProps & DispatchProps;

// heading cell of releases table rows
const ReleasesTableChannelHeading = (props: ReleasesTableChannelHeadingProps) => {
  const {
    risk,
    branch,
    drag,
    revisions,
    availableBranches,
    numberOfBranches,
    currentTrack,
    pendingChannelMap,
    openBranches,
  } = props;

  const branchName = branch ? branch.branch : null;

  const channel = getChannelName(currentTrack, risk, branchName);

  const rowRevisions =
    revisions || pendingChannelMap[channel];

  const hasOpenBranches = openBranches.includes(channel);

  const canDrag = !(!rowRevisions || props.pendingCloses.includes(channel));

  let canBePromoted = true;
  let canBeClosed = true;
  let promoteTooltip;

  if (risk === STABLE && !branch) {
    canBePromoted = false;
  }

  if ([STABLE, CANDIDATE, BETA, EDGE].indexOf(risk) === -1) {
    canBeClosed = false;
  }

  if (!rowRevisions || props.pendingCloses.includes(channel)) {
    canBePromoted = false;
    canBeClosed = false;
  }

  if (
    channel === AVAILABLE &&
    (!rowRevisions || Object.keys(rowRevisions).length === 0)
  ) {
    promoteTooltip = disabledBecauseNotSelected;
  }

  let targetChannels: TargetChannel[] = [];

  if (canBePromoted) {
    let targetChannelRisks: string[];

    if (branch) {
      targetChannelRisks = RISKS.slice(0, RISKS.indexOf(risk) + 1);
    } else {
      targetChannelRisks = RISKS.slice(0, RISKS.indexOf(risk));
    }

    targetChannels = targetChannelRisks.map((risk) => {
      return { channel: getChannelName(currentTrack, risk), isDisabled: false };
    });

    // check for devmode revisions
    if (risk !== STABLE && risk !== CANDIDATE) {
      const hasDevmodeRevisions = Object
        .values(rowRevisions)
        .filter((revision) => revision !== undefined)
        .some(isInDevmode);

      // remove stable/beta channels as targets if any revision is in devmode
      if (hasDevmodeRevisions) {
        targetChannels[0].isDisabled = true;
        targetChannels[0].reason = disabledBecauseDevmode;
        targetChannels[1].isDisabled = true;
        targetChannels[1].reason = disabledBecauseDevmode;
      }
    }

    // add branches
    const branchRisks = RISKS.slice(0, RISKS.indexOf(risk) + 1);
    let isParent = false;
    const targetChannelBranches = availableBranches
      .filter((b: Branch) => {
        return (
          b.track === currentTrack &&
          channel !== getChannelName(currentTrack, b.risk, b.branch) &&
          RISKS.indexOf(b.risk) <=
            RISKS.indexOf(branchRisks[branchRisks.length - 1])
        );
      })
      .map((b: Branch) => {
        const channelName = getChannelName(currentTrack, b.risk, b.branch);
        isParent = channelName.indexOf(channel) > -1;
        return {
          channel: channelName,
          isDisabled: false,
          display: ` ↳/${b.branch}`,
        };
      });

    // If the current channel is the parent of the branches, show the channel
    // in the menu but disable it.
    if (isParent) {
      targetChannels.push({
        channel: channel,
        isDisabled: true,
      });
    }
    targetChannels = targetChannels.concat(targetChannelBranches);

    // filter out channels that have the same revisions already released
    targetChannels.forEach((targetChannel) => {
      if (
        !canReleaseToChannel(
          rowRevisions,
          pendingChannelMap[targetChannel.channel],
          targetChannel.channel,
        )
      ) {
        targetChannel.isDisabled = true;
        targetChannel.reason = disabledBecauseReleased;
      }
    });

    if (targetChannels.length === 0) {
      canBePromoted = false;
    } else {
      // order the channel names
      // @ts-ignore
      const channelOrder = sortChannels(
        targetChannels.map((channel) => channel.channel),
      ).list;

      // remap targetChannels to this new order
      targetChannels = channelOrder.flatMap((name) => {
        const targetChannel = targetChannels.find((t) => t.channel === name);
        return targetChannel ? [targetChannel] : [];
      });
    }
  }

  const filteredChannel =
    props.filters && getChannelName(props.filters.track, props.filters.risk);

  let hasSameVersion = false;
  let channelVersion = "";
  // a map of revision number to a list of architectures
  const versionsMap: {[version: string]: string[]} = {};

  let isLaunchpadBuild = false;
  let channelBuild = "";
  let channelBuildDate = null;
  const buildMap: {[buildRequestId: string]: Revision[]} = {};

  if (rowRevisions) {
    // calculate map of architectures for each version
    for (const arch in rowRevisions) {
      const revision = rowRevisions[arch];
      if (revision) {
        const version = revision.version;
        if (!versionsMap[version]) {
          versionsMap[version] = [];
        }
        versionsMap[version].push(arch);

        const buildRequestId =
          revision.attributes && revision.attributes["build-request-id"];

        if (buildRequestId) {
          if (!buildMap[buildRequestId]) {
            buildMap[buildRequestId] = [];
          }
          buildMap[buildRequestId].push(revision);
        }
      }
    }

    hasSameVersion = Object.keys(versionsMap).length === 1;
    if (hasSameVersion) {
      channelVersion = Object.values(rowRevisions).shift()?.version || "";
    } else {
      channelVersion = "Multiple versions";
    }

    isLaunchpadBuild = Object.keys(buildMap).length > 0;
    if (isLaunchpadBuild) {
      channelBuild = Object.keys(buildMap)[0];
      const timestamp = Object.values(revisions).shift()?.attributes["build-request-timestamp"];
      channelBuildDate = timestamp && new Date(timestamp);
    }
  }

  let rowTitle: any = risk === AVAILABLE ? channelVersion : channel;

  if (risk === BUILD) {
    rowTitle = <>{channelBuild}</>;
  }

  if (branch) {
    rowTitle = `↳/${rowTitle.split("/").pop()}`;
  }

  let timeUntilExpiration;
  if (branch) {
    timeUntilExpiration = formatDistanceToNow(Date.parse(branch.expiration));
  }

  const promoteRevisions = (targetChannel: any) => {
    Object.values(rowRevisions).forEach(
      (revision: any) =>
        canBeReleased(revision) &&
        props.promoteRevision(revision, targetChannel),
    );
  };

  const triggerGAEvent = (targetChannel: any, actionType: string) => {
    if (actionType === "close") {
      props.triggerGAEvent("click-close-channel", targetChannel);
    } else {
      props.triggerGAEvent("click-promote", channel, targetChannel);
    }
  };

  return (
    <div
      ref={drag}
      className={`p-releases-channel ${
        filteredChannel === channel ? "is-active" : ""
      } ${canDrag ? "is-draggable" : ""}`}
      onMouseEnter={(e) => {
        const target = e.target as HTMLElement;
        if (target.parentElement) {
          target.parentElement.classList.add("is-hovered");
        }
      }}
    >
      <div className="p-releases-channel__inner">
        <Handle />
        <div className="p-releases-channel__name p-tooltip p-tooltip--btm-center">
          <span className="p-release-data__info">
            <span
              className={`p-release-data__title ${
                canBePromoted || canBeClosed ? "has-button" : ""
              }`}
              title={channel}
            >
              {rowTitle}
            </span>
          </span>
        </div>

        <span className="p-releases-table__menus u-hide--small">
          {(canBePromoted || canBeClosed) && (
            <ChannelMenu
              tooltip={promoteTooltip}
              targetChannels={targetChannels}
              promoteToChannel={promoteRevisions}
              channel={channel}
              closeChannel={canBeClosed ? props.closeChannel : undefined}
              gaEvent={triggerGAEvent}
            />
          )}
        </span>
      </div>

      <div className="p-release-data__meta-container">
        {risk !== AVAILABLE && (
          <span className="p-release-data__meta">
            {channelVersion}
            {channelBuildDate && ` | ${format(channelBuildDate, "dd MMM yy")}`}
          </span>
        )}
      </div>

      {!!numberOfBranches && numberOfBranches > 0 && (
        <span
          className={`p-releases-table__branches ${
            hasOpenBranches ? "is-open" : ""
          }`}
          onClick={props.toggleBranches.bind(this, channel)}
        >
          <i className="p-icon--branch" />
          {numberOfBranches}
        </span>
      )}

      {!!branch && !!timeUntilExpiration && (
        <span className="p-releases-table__branch-timeleft" title={branch.when}>
          {timeUntilExpiration}
        </span>
      )}
    </div>
  );
};

const mapStateToProps = (
  state: ReleasesReduxState,
  props: {
    branch?: Branch;
    risk: string
  }
): StateProps => {
  const availableBranches = getBranches(state);

  const numberOfBranches = props.branch
    ? null
    : availableBranches.filter((b) => b.risk === props.risk).length;

  return {
    availableBranches,
    numberOfBranches,
    currentTrack: state.currentTrack,
    filters: state.history.filters,
    pendingCloses: Object.values(state.pendingChanges.pendingCloses),
    pendingChannelMap: getPendingChannelMap(state),
    openBranches: state.branches,
  };
};

const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => {
  return {
    promoteRevision: (revision: Revision, targetChannel: string) =>
      dispatch(promoteRevision(revision, targetChannel)),
    closeChannel: (channel: string) => dispatch(closeChannel(channel)),
    toggleBranches: (channel: string) => dispatch(toggleBranches(channel)),
    triggerGAEvent: (...eventProps: Parameters<typeof triggerGAEvent>) =>
      dispatch(triggerGAEvent(...eventProps)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ReleasesTableChannelHeading);
