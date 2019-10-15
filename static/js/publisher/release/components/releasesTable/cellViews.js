import React, { Fragment } from "react";
import PropTypes from "prop-types";

import DevmodeRevision from "../devmodeRevision";

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

// contents of a cell with a revision
export const RevisionInfo = ({
  revision,
  isPending,
  showVersion,
  progressiveState
}) => {
  let from = null;
  let buildIcon = null;

  if (isRevisionBuiltOnLauchpad(revision)) {
    buildIcon = <i className="p-icon--lp" />;
  }

  if (progressiveState && progressiveState.from) {
    from = progressiveState.from;
  }

  return (
    <Fragment>
      <span className="p-release-data__info">
        <span className="p-release-data__title">
          <DevmodeRevision
            revision={revision}
            showTooltip={false}
            isProgressive={from ? true : false}
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
          {from && (
            <Fragment>
              <b>
                Progressive release of revision {revision.revision} in progress
              </b>
              <br />
              Revision: <b>{from}</b>
              {progressiveState
                ? ` (${100 - progressiveState.percentage}% of devices)`
                : ""}
              <br />
              Revision: <b>{revision.revision}</b> (
              {progressiveState.percentage}% of devices)
            </Fragment>
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
  progressiveState: PropTypes.object
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
