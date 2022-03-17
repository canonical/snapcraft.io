import React from "react";
import PropTypes from "prop-types";

import RevisionLabel from "../revisionLabel";
import ContextualMenu from "../contextualMenu";
import { RISKS, RISKS_WITH_AVAILABLE } from "../../constants";

import {
  isInDevmode,
  isRevisionBuiltOnLauchpad,
  canBeReleased,
} from "../../helpers";
import { useDragging, Handle } from "../dnd";

import { promoteRevision } from "../../actions/pendingReleases";

import ReleaseMenuItem from "./releaseMenuItem";

// content of a cell when channel is closed
export const CloseChannelInfo = () => (
  <>
    close channel
    <span className="p-tooltip__message">Pending channel close</span>
  </>
);

// content of an empty cell in 'Available' row (when nothing was assigned)
export const UnassignedInfo = ({ availableCount }) => (
  <span className="p-release-data__info">
    <span className="p-release-data__title">Add revision</span>
    <span className="p-release-data__meta">{availableCount} available</span>
  </span>
);

UnassignedInfo.propTypes = {
  availableCount: PropTypes.number,
};

// content of empty cell in channel row (nothing released or tracking channel)
export const EmptyInfo = ({ trackingChannel }) => {
  const trackingChannelSplit = trackingChannel
    ? trackingChannel.split("/")
    : null;

  return (
    <>
      <span className="p-release-data__info--empty">
        {trackingChannel ? (
          <small>
            Tracking {trackingChannelSplit[0]}/<br />
            {trackingChannelSplit[1]}
          </small>
        ) : (
          "-"
        )}
      </span>

      <span className="p-tooltip__message">
        {trackingChannel
          ? `Tracking ${trackingChannel}`
          : "Nothing currently released"}
      </span>
    </>
  );
};

EmptyInfo.propTypes = {
  trackingChannel: PropTypes.string,
};

const ProgressiveTooltip = ({
  revision,
  previousRevision,
  progressiveState,
  pendingProgressiveState,
  version,
  confinement,
}) => {
  let previousRevisionInfo = "";
  let revisionInfo = "";
  if (progressiveState) {
    previousRevisionInfo = ` ${100 - progressiveState.percentage}%`;
    revisionInfo = ` ${progressiveState.percentage || 0}%`;
    if (pendingProgressiveState) {
      previousRevisionInfo = `${previousRevisionInfo} → ${
        100 - pendingProgressiveState.percentage
      }%`;
      revisionInfo = `${revisionInfo} → ${pendingProgressiveState.percentage}%`;
    }
    previousRevisionInfo = `${previousRevisionInfo}`;
    revisionInfo = `${revisionInfo}`;
  }

  let previousRevisionState;

  if (revision.progressive) {
    previousRevisionState = (
      <>
        {Math.floor(100 - revision?.progressive["current-percentage"])}% →{" "}
        {previousRevisionInfo}
      </>
    );
  }

  let revisionState;

  if (revision.progressive) {
    revisionState = (
      <>
        {Math.floor(revision.progressive["current-percentage"])}% →{" "}
        {revisionInfo}
      </>
    );
  }

  const currentRevisionData = (
    <>
      <strong>{revision.revision} (progressive)</strong>
      <br />
      <strong>{revisionState}</strong>
      <br />
      <strong>{version}</strong>
      <br />
      <strong>{confinement}</strong>
    </>
  );

  const previousRevisionData = (
    <>
      <strong>{previousRevision.revision}</strong>
      <br />
      <strong>{previousRevisionState}</strong>
      <br />
      <strong>{previousRevision.version}</strong>
      <br />
      <strong>{previousRevision.confinement}</strong>
    </>
  );

  const tooltipLabels = (
    <>
      Revision:
      <br />
      Release progress:
      <br />
      Version:
      <br />
      Confinement:
    </>
  );

  return (
    <div className="row">
      <div className="col-4">{tooltipLabels}</div>
      <div className="col-4">{previousRevisionData}</div>
      <div className="col-4">{currentRevisionData}</div>
    </div>
  );
};

ProgressiveTooltip.propTypes = {
  revision: PropTypes.object,
  previousRevision: PropTypes.object,
  progressiveState: PropTypes.object,
  pendingProgressiveState: PropTypes.object,
  version: PropTypes.string,
  confinement: PropTypes.string,
};

// contents of a cell with a revision
export const RevisionInfo = ({
  revision,
  isPending,
  progressiveState,
  previousRevision,
  pendingProgressiveState,
}) => {
  let buildIcon = null;

  if (isRevisionBuiltOnLauchpad(revision)) {
    buildIcon = <i className="p-icon--lp" />;
  }

  const releasable = canBeReleased(revision);

  const blockedMessage = (revision) => (
    <>
      Can’t be released: <b>{revision.status}.</b>
      <br />
    </>
  );

  const isProgressive =
    previousRevision &&
    previousRevision.progressive &&
    previousRevision.progressive.paused !== null &&
    previousRevision.progressive.percentage !== null;

  return (
    <>
      <span className="p-release-data__info">
        <span className="p-release-data__title">
          <RevisionLabel
            revision={revision}
            showTooltip={false}
            isProgressive={isProgressive}
            previousRevision={previousRevision?.revision}
          />
        </span>
        <span className="p-release-data__meta">
          {revision.version}
          {revision.attributes["build-request-id"] &&
            ` | ${revision.attributes["build-request-id"]}`}
        </span>
      </span>
      <span className="p-tooltip__message">
        {isPending && "Pending release of:"}

        <div className="p-tooltip__group">
          {isProgressive ? (
            <ProgressiveTooltip
              revision={revision}
              previousRevision={previousRevision}
              progressiveState={progressiveState}
              pendingProgressiveState={pendingProgressiveState}
              version={revision.version}
              confinement={revision.confinement}
            />
          ) : (
            <>
              {!releasable && blockedMessage(revision)}
              Revision: <strong>{revision.revision}</strong>
              <br />
              Version: <strong>{revision.version}</strong>
              {revision.attributes && revision.attributes["build-request-id"] && (
                <>
                  <br />
                  Build: {buildIcon}{" "}
                  <strong>{revision.attributes["build-request-id"]}</strong>
                </>
              )}
              {isInDevmode(revision) && (
                <>
                  <br />$
                  {revision.confinement === "devmode" ? (
                    <>
                      Confinement: <strong>devmode</strong>
                    </>
                  ) : (
                    <>
                      Grade: <strong>devel</strong>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {isInDevmode(revision) && (
          <div className="p-tooltip__group">
            Revisions in <b>devmode</b> or with grade <b>devel</b> can’t
            <br />
            be promoted to stable or candidate channels.
          </div>
        )}
      </span>
    </>
  );
};

RevisionInfo.propTypes = {
  revision: PropTypes.object,
  isPending: PropTypes.bool,
  progressiveState: PropTypes.object,
  previousRevision: PropTypes.object,
  pendingProgressiveState: PropTypes.object,
};

// generic draggable view of releases table cell
export const ReleasesTableCellView = (props) => {
  const { item, canDrag, children, actions, cellType, current } = props;

  const [isDragging, isGrabbing, drag] = useDragging({
    item,
    canDrag,
  });

  const classNames = [
    "p-releases-table__cell",
    isGrabbing ? "is-grabbing" : "",
    isDragging ? "is-dragging" : "",
    canDrag ? "is-draggable" : "",
  ].join(" ");

  const className = `${classNames} ${props.className}`;

  return (
    <div className={className}>
      <div
        ref={drag}
        className="p-release-data p-tooltip p-tooltip--btm-center"
      >
        {children}
        {canDrag && (
          <>
            <ContextualMenu
              className="p-button is-small"
              label={cellType === "revision" ? "Release" : "Promote"}
            >
              <span className="p-contextual-menu__group">
                <span className="p-contextual-menu__item">
                  {cellType === "revision" ? "Release" : "Promote"} to:
                </span>
                {RISKS.map((risk) => {
                  return (
                    <ReleaseMenuItem
                      key={risk}
                      currentTrack={risk}
                      risk={risk}
                      pendingChannelMap={RISKS_WITH_AVAILABLE}
                      item={item}
                      promoteRevision={promoteRevision}
                      current={current}
                    />
                  );
                })}
              </span>
            </ContextualMenu>
            <Handle />
          </>
        )}
      </div>
      {actions}
    </div>
  );
};

ReleasesTableCellView.propTypes = {
  item: PropTypes.object,
  canDrag: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
  cellType: PropTypes.string,
  current: PropTypes.string,
};
