import PropTypes from "prop-types";
import { connect } from "react-redux";

import { getPendingChannelMap } from "../../selectors";
import { useDrop, DND_ITEM_REVISIONS } from "../dnd";

import { promoteRevision } from "../../actions/pendingReleases";
import { triggerGAEvent } from "../../actions/gaEventTracking";

import { STABLE, CANDIDATE, BETA, EDGE } from "../../constants";

import {
  getChannelName,
  isInDevmode,
  canBeReleased,
  getLatestChannelRevisionRelease,
} from "../../helpers";

import ReleasesTableChannelRow from "./channelRow";

const getRevisionsToDrop = (
  revisions: any[],
  targetChannel: string,
  channelMap: { [x: string]: any },
) => {
  const targetChannelArchs = channelMap[targetChannel];

  return revisions.filter((revision) => {
    return revision.architectures.some((arch: string | number) => {
      // if nothing released to target channel in this arch
      if (!targetChannelArchs || !targetChannelArchs[arch]) {
        return true;
      } else {
        const isProgressive = getLatestChannelRevisionRelease(
          targetChannelArchs[arch],
          targetChannel,
        )?.isProgressive;
        // if different revision released to an arch
        // or if the current release in the target arch is progressive
        if (
          revision.revision !== targetChannelArchs[arch].revision ||
          isProgressive
        ) {
          return true;
        }
      }
      return false;
    });
  });
};

// releases table row with channel data that can be a drop target for revisions
const ReleasesTableDroppableRow = (props: {
  currentTrack: any;
  risk: any;
  branch: any;
  revisions: any;
  promoteRevision: any;
  pendingChannelMap: any;
  triggerGAEvent: any;
}) => {
  const {
    currentTrack,
    risk,
    branch,
    revisions,
    promoteRevision,
    pendingChannelMap,
    triggerGAEvent,
  } = props;

  const branchName = branch ? branch.branch : null;

  const channel = getChannelName(currentTrack, risk, branchName);

  const [{ isOver, canDrop, item }, drop] = useDrop({
    accept: DND_ITEM_REVISIONS,
    drop: (item: any) => {
      item.revisions.forEach(
        (r: { status: string }) =>
          canBeReleased(r) && promoteRevision(r, channel),
      );

      if (item.revisions.length > 1) {
        triggerGAEvent(
          "drop-channel",
          `${currentTrack}/${item.risk}/${item.branch ? item.branch : null}`,
          `${currentTrack}/${risk}/${branchName}`,
        );
      } else {
        triggerGAEvent(
          "drop-revision",
          `${currentTrack}/${item.risk}/${item.branch ? item.branch : null}/${
            item.architectures[0]
          }`,
          `${currentTrack}/${risk}/${branchName}/${item.architectures[0]}`,
        );
      }
    },
    canDrop: (item) => {
      const draggedRevisions = item.revisions;

      const branchName = branch ? branch.branch : null;

      const draggedChannel = getChannelName(
        currentTrack,
        item.risk,
        item.branch,
      );
      const dropChannel = getChannelName(currentTrack, risk, branchName);

      // can't drop on 'available revisions row'
      if (
        risk !== STABLE &&
        risk !== CANDIDATE &&
        risk !== BETA &&
        risk !== EDGE
      ) {
        return false;
      }

      // can't drop on itself
      if (draggedChannel === dropChannel) {
        return false;
      }

      // can't drop if there is nothing in dragged revisions
      if (!draggedRevisions.length) {
        return false;
      }

      // can't drop devmode to stable/candidate
      if (risk === STABLE || risk === CANDIDATE) {
        const hasDevmodeRevisions = draggedRevisions.some(isInDevmode);

        if (hasDevmodeRevisions) {
          return false;
        }
      }

      // can't drop same revisions
      if (
        !getRevisionsToDrop(draggedRevisions, dropChannel, pendingChannelMap)
          .length
      ) {
        return false;
      }

      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      item: monitor.getItem(),
    }),
  });

  const channelName = getChannelName(currentTrack, risk, branchName);

  const versions = pendingChannelMap[channel];

  const currentVersions: any[] = [];

  if (versions) {
    for (const [value] of Object.entries(versions)) {
      if (value && !currentVersions.includes(versions[value].version)) {
        currentVersions.push(versions[value].version);
      }
    }
  }

  let versionCountString = "";

  if (currentVersions.length > 1) {
    versionCountString = "Multiple versions";
  } else {
    versionCountString = currentVersions[0];
  }

  return (
    <>
      <div
        className="u-space-between u-hide--medium u-hide--large"
        style={{ marginBottom: "0.5rem" }}
      >
        <p className="p-heading--5 u-no-margin--bottom u-no-padding--top">
          {channelName}
        </p>
        <small
          className="u-text-muted u-no-margin--bottom"
          style={{ lineHeight: 1.5 }}
        >
          {versionCountString}
        </small>
      </div>
      <div className="p-releases-table__row--container" ref={drop}>
        <ReleasesTableChannelRow
          risk={risk}
          branch={branch}
          // @ts-ignore
          revisions={revisions}
          isOverParent={isOver}
          draggedItem={item}
          canDrop={canDrop}
        />
      </div>
    </>
  );
};

ReleasesTableDroppableRow.propTypes = {
  // props
  risk: PropTypes.string.isRequired,
  branch: PropTypes.object,
  revisions: PropTypes.object,

  // state
  currentTrack: PropTypes.string.isRequired,
  pendingChannelMap: PropTypes.object,

  // actions
  promoteRevision: PropTypes.func.isRequired,
  triggerGAEvent: PropTypes.func.isRequired,
};

const mapStateToProps = (state: any) => {
  return {
    currentTrack: state.currentTrack,
    pendingChannelMap: getPendingChannelMap(state),
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    promoteRevision: (revision: any, targetChannel: any) =>
      dispatch(promoteRevision(revision, targetChannel)),
    triggerGAEvent: (...eventProps: any) =>
      dispatch(triggerGAEvent(...eventProps)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ReleasesTableDroppableRow);
