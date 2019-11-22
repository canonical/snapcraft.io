import React, { Fragment } from "react";
import PropTypes from "prop-types";

import RevisionLabel from "../revisionLabel";

import { isInDevmode, isRevisionBuiltOnLauchpad } from "../../helpers";
import { useDragging, Handle } from "../dnd";

// content of a cell when channel is closed
export const CloseChannelInfo = () => (
  <Fragment>
    close channel
    <span className="p-tooltip__message">Pending channel close</span>
  </Fragment>
);

// content of an empty cell in 'Available' row (when nothing was assigned)
export const UnassignedInfo = ({ availableCount }) => (
  <span className="p-release-data__info">
    <span className="p-release-data__title">Add revision</span>
    <span className="p-release-data__meta">{availableCount} available</span>
  </span>
);

UnassignedInfo.propTypes = {
  availableCount: PropTypes.number
};

// content of empty cell in channel row (nothing released or tracking channel)
export const EmptyInfo = ({ trackingChannel }) => {
  return (
    <Fragment>
      <span className="p-release-data__info--empty">
        {trackingChannel ? "↑" : "–"}
      </span>

      <span className="p-tooltip__message">
        {trackingChannel
          ? `Tracking channel ${trackingChannel}`
          : "Nothing currently released"}
      </span>
    </Fragment>
  );
};

EmptyInfo.propTypes = {
  trackingChannel: PropTypes.string
};

const ProgressiveState = ({
  revision,
  previousRevision,
  progressiveState,
  pendingProgressiveState
}) => {
  let previousRevisionInfo = "";
  let revisionInfo = "";
  if (progressiveState) {
    previousRevisionInfo = ` (${100 - progressiveState.percentage}%`;
    revisionInfo = ` (${progressiveState.percentage}%`;
    if (pendingProgressiveState) {
      previousRevisionInfo = `${previousRevisionInfo} → ${100 -
        pendingProgressiveState.percentage}%`;
      revisionInfo = `${revisionInfo} → ${pendingProgressiveState.percentage}%`;
    }
    previousRevisionInfo = `${previousRevisionInfo} of devices)`;
    revisionInfo = `${revisionInfo} of devices)`;
  }

  const previousRevisionState = (
    <Fragment>
      Revision: <b>{previousRevision}</b>
      {previousRevisionInfo}
    </Fragment>
  );

  const revisionState = (
    <Fragment>
      Revision: <b>{revision}</b>
      {revisionInfo}
    </Fragment>
  );

  return (
    <Fragment>
      <b>Progressive release of revision {revision} in progress</b>
      <br />
      {previousRevisionState}
      <br />
      {revisionState}
    </Fragment>
  );
};

ProgressiveState.propTypes = {
  revision: PropTypes.number,
  previousRevision: PropTypes.number,
  progressiveState: PropTypes.object,
  pendingProgressiveState: PropTypes.object
};

// contents of a cell with a revision
export const RevisionInfo = ({
  revision,
  isPending,
  showVersion,
  progressiveState,
  previousRevision,
  pendingProgressiveState
}) => {
  let buildIcon = null;

  if (isRevisionBuiltOnLauchpad(revision)) {
    buildIcon = <i className="p-icon--lp" />;
  }

  return (
    <Fragment>
      <span className="p-release-data__info">
        <span className="p-release-data__title">
          <RevisionLabel
            revision={revision}
            showTooltip={false}
            isProgressive={previousRevision ? true : false}
          />
        </span>
        {showVersion && (
          <span className="p-release-data__meta">{revision.version}</span>
        )}
      </span>
      <span className="p-tooltip__message">
        {isPending && "Pending release of:"}

        <div className="p-tooltip__group">
          Revision: <b>{revision.revision}</b>
          <br />
          Version: <b>{revision.version}</b>
          {revision.attributes &&
            revision.attributes["build-request-id"] && (
              <Fragment>
                <br />
                Build: {buildIcon}{" "}
                <b>{revision.attributes["build-request-id"]}</b>
              </Fragment>
            )}
          {isInDevmode(revision) && (
            <Fragment>
              <br />
              {revision.confinement === "devmode" ? (
                <Fragment>
                  Confinement: <b>devmode</b>
                </Fragment>
              ) : (
                <Fragment>
                  Grade: <b>devel</b>
                </Fragment>
              )}
            </Fragment>
          )}
          <br />
          {previousRevision && (
            <ProgressiveState
              revision={revision.revision}
              previousRevision={previousRevision}
              progressiveState={progressiveState}
              pendingProgressiveState={pendingProgressiveState}
            />
          )}
        </div>

        {isInDevmode(revision) && (
          <div className="p-tooltip__group">
            Revisions in devmode can’t be promoted
            <br />
            to stable or candidate channels.
          </div>
        )}
      </span>
    </Fragment>
  );
};

RevisionInfo.propTypes = {
  revision: PropTypes.object,
  isPending: PropTypes.bool,
  showVersion: PropTypes.bool,
  progressiveState: PropTypes.object,
  previousRevision: PropTypes.number,
  pendingProgressiveState: PropTypes.object
};

// generic draggable view of releases table cell
export const ReleasesTableCellView = props => {
  const { item, canDrag, children, actions } = props;

  const [isDragging, isGrabbing, drag] = useDragging({
    item,
    canDrag
  });

  const classNames = [
    "p-releases-table__cell",
    isGrabbing ? "is-grabbing" : "",
    isDragging ? "is-dragging" : "",
    canDrag ? "is-draggable" : ""
  ].join(" ");

  const className = `${classNames} ${props.className}`;

  return (
    <div className={className}>
      <div
        ref={drag}
        className="p-release-data p-tooltip p-tooltip--btm-center"
      >
        <Handle />

        {children}
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
  actions: PropTypes.node
};
