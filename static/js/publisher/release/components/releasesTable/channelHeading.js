import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { format, parse, distanceInWordsToNow, addDays } from "date-fns";

import { sortChannels } from "../../../../libs/channels";

import {
  getArchitectures,
  getPendingChannelMap,
  hasPendingRelease,
  getBranches
} from "../../selectors";
import { Handle } from "../dnd";

import { promoteRevision } from "../../actions/pendingReleases";
import { closeChannel } from "../../actions/pendingCloses";

import { toggleBranches } from "../../actions/branches";

import { triggerGAEvent } from "../../actions/gaEventTracking";

import {
  RISKS_WITH_AVAILABLE as RISKS,
  AVAILABLE,
  BUILD,
  STABLE,
  CANDIDATE,
  BETA,
  EDGE
} from "../../constants";

import { getChannelName, isInDevmode } from "../../helpers";
import ChannelMenu from "../channelMenu";

const disabledBecauseDevmode = (
  <Fragment>
    Revisions with devmode confinement or devel grade <br />
    cannot be released to stable or candidate channels.
  </Fragment>
);

const disabledBecauseReleased = "The same revisions are already promoted.";

const disabledBecauseNotSelected = "Select some revisions to promote them.";

// TODO: move to selectors or helpers?
const compareRevisionsPerArch = (
  currentRevisionsByArch,
  targetRevisionsByArch
) => {
  if (currentRevisionsByArch) {
    return Object.keys(currentRevisionsByArch).every(arch => {
      return (
        targetRevisionsByArch &&
        targetRevisionsByArch[arch] &&
        currentRevisionsByArch[arch].revision ===
          targetRevisionsByArch[arch].revision
      );
    });
  }

  return currentRevisionsByArch === targetRevisionsByArch;
};

// heading cell of releases table rows
const ReleasesTableChannelHeading = props => {
  const {
    currentTrack,
    risk,
    branch,
    numberOfBranches,
    archs,
    pendingChannelMap,
    openBranches,
    availableBranches,
    drag,
    revisions
  } = props;

  const branchName = branch ? branch.branch : null;

  const channel = getChannelName(currentTrack, risk, branchName);

  const rowRevisions = revisions || pendingChannelMap[channel];

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

  let targetChannels = [];

  if (canBePromoted) {
    let targetChannelRisks;

    if (branch) {
      targetChannelRisks = RISKS.slice(0, RISKS.indexOf(risk) + 1);
    } else {
      targetChannelRisks = RISKS.slice(0, RISKS.indexOf(risk));
    }

    targetChannels = targetChannelRisks.map(risk => {
      return { channel: getChannelName(currentTrack, risk) };
    });

    // check for devmode revisions
    if (risk !== STABLE && risk !== CANDIDATE) {
      const hasDevmodeRevisions = Object.values(rowRevisions).some(isInDevmode);

      // remove stable and beta channels as targets if any revision
      // is in devmode
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
      .filter(b => {
        return (
          b.track === currentTrack &&
          channel !== getChannelName(currentTrack, b.risk, b.branch) &&
          RISKS.indexOf(b.risk) <=
            RISKS.indexOf(branchRisks[branchRisks.length - 1])
        );
      })
      .map(b => {
        const channelName = getChannelName(currentTrack, b.risk, b.branch);
        isParent = channelName.indexOf(channel) > -1;
        return {
          channel: channelName,
          display: ` ↳/${b.branch}`
        };
      });

    // If the current channel is the parent of the branches, show the channel
    // in the menu but disable it.
    if (isParent) {
      targetChannels.push({
        channel: channel,
        isDisabled: true
      });
    }
    targetChannels = targetChannels.concat(targetChannelBranches);

    // filter out channels that have the same revisions already released
    targetChannels.forEach(targetChannel => {
      if (
        compareRevisionsPerArch(
          rowRevisions,
          pendingChannelMap[targetChannel.channel]
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
      const channelOrder = sortChannels(
        targetChannels.map(channel => channel.channel)
      ).list;

      // remap targetchannels to this new order
      targetChannels = channelOrder.map(name => {
        return targetChannels.find(t => t.channel === name);
      });
    }
  }

  const filteredChannel =
    props.filters && getChannelName(props.filters.track, props.filters.risk);

  let hasSameVersion = false;
  let channelVersion = "";
  let versionsMap = {};

  let isLaunchpadBuild = false;
  let channelBuild = "";
  let channelBuildDate = null;
  let buildMap = {};

  if (rowRevisions) {
    // calculate map of architectures for each version
    for (const arch in rowRevisions) {
      const revision = rowRevisions[arch];
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

    hasSameVersion = Object.keys(versionsMap).length === 1;
    if (hasSameVersion) {
      channelVersion = Object.values(rowRevisions)[0].version;
    } else {
      channelVersion = "Multiple versions";
    }

    isLaunchpadBuild = Object.keys(buildMap).length === 1;
    if (isLaunchpadBuild) {
      channelBuild = Object.keys(buildMap)[0];
      channelBuildDate = new Date(
        Object.values(revisions)[0].attributes["build-request-timestamp"]
      );
    }
  }

  const channelVersionTooltip = (
    <Fragment>
      {Object.keys(versionsMap).map(version => {
        return (
          <span key={`tooltip-${channel}-${version}`}>
            {version}:{" "}
            <b>
              {versionsMap[version].length === archs.length
                ? "All architectures"
                : versionsMap[version].join(", ")}
            </b>
            <br />
            {isLaunchpadBuild && (
              <Fragment>
                Build: <i className="p-icon--lp" /> <b>{channelBuild}</b>
                <br />
                Built at: <b>{format(channelBuildDate, "YYYY-MM-DD HH:mm")}</b>
              </Fragment>
            )}
          </span>
        );
      })}
    </Fragment>
  );

  let rowTitle = risk === AVAILABLE ? channelVersion : channel;

  if (risk === BUILD) {
    rowTitle = (
      <Fragment>
        <i className="p-icon--lp" />{" "}
        {distanceInWordsToNow(channelBuildDate, { addSuffix: true })}
      </Fragment>
    );
  }

  if (branch) {
    rowTitle = `↳/${rowTitle.split("/").pop()}`;
  }

  let timeUntilExpiration;
  if (branch) {
    const end = addDays(parse(branch.when), 30);
    timeUntilExpiration = distanceInWordsToNow(end);
  }

  const promoteRevisions = targetChannel => {
    Object.values(rowRevisions).forEach(revision =>
      props.promoteRevision(revision, targetChannel)
    );
  };

  const triggerGAEvents = (targetChannel, actionType) => {
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
    >
      <Handle />
      <div className="p-releases-channel__name p-tooltip p-tooltip--btm-center">
        <span className="p-release-data__info">
          <span className="p-release-data__title" title={channel}>
            {rowTitle}
          </span>
          {risk !== AVAILABLE && (
            <span className="p-release-data__meta">{channelVersion}</span>
          )}
          {channelVersion && (
            <span className="p-tooltip__message">{channelVersionTooltip}</span>
          )}
        </span>
      </div>

      <span className="p-releases-table__menus">
        {(canBePromoted || canBeClosed) && (
          <ChannelMenu
            tooltip={promoteTooltip}
            targetChannels={targetChannels}
            promoteToChannel={promoteRevisions}
            channel={channel}
            closeChannel={canBeClosed ? props.closeChannel : null}
            gaEvent={triggerGAEvents}
          />
        )}
      </span>

      {numberOfBranches > 0 && (
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

      {timeUntilExpiration && (
        <span className="p-releases-table__branch-timeleft" title={branch.when}>
          {timeUntilExpiration} left
        </span>
      )}
    </div>
  );
};

ReleasesTableChannelHeading.propTypes = {
  // props
  drag: PropTypes.func,
  risk: PropTypes.string.isRequired,
  branch: PropTypes.object,
  availableBranches: PropTypes.array,

  revisions: PropTypes.object,

  // state
  numberOfBranches: PropTypes.number,
  currentTrack: PropTypes.string.isRequired,
  filters: PropTypes.object,
  pendingCloses: PropTypes.array.isRequired,

  archs: PropTypes.array.isRequired,
  pendingChannelMap: PropTypes.object,

  hasPendingRelease: PropTypes.func,

  openBranches: PropTypes.array,

  // actions
  closeChannel: PropTypes.func.isRequired,
  promoteRevision: PropTypes.func.isRequired,
  toggleBranches: PropTypes.func.isRequired,
  triggerGAEvent: PropTypes.func.isRequired
};

const mapStateToProps = (state, props) => {
  const availableBranches = getBranches(state);

  const numberOfBranches = props.branch
    ? null
    : availableBranches.filter(branch => branch.risk === props.risk).length;

  return {
    availableBranches,
    numberOfBranches,
    currentTrack: state.currentTrack,
    filters: state.history.filters,
    pendingCloses: state.pendingCloses,
    archs: getArchitectures(state),
    pendingChannelMap: getPendingChannelMap(state),
    hasPendingRelease: (channel, arch) =>
      hasPendingRelease(state, channel, arch),
    openBranches: state.branches
  };
};

const mapDispatchToProps = dispatch => {
  return {
    promoteRevision: (revision, targetChannel) =>
      dispatch(promoteRevision(revision, targetChannel)),
    closeChannel: channel => dispatch(closeChannel(channel)),
    toggleBranches: channel => dispatch(toggleBranches(channel)),
    triggerGAEvent: (...eventProps) => dispatch(triggerGAEvent(...eventProps))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesTableChannelHeading);
