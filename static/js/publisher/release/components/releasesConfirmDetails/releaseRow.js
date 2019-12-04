import React, { Fragment } from "react";
import PropTypes from "prop-types";

const ReleaseRow = ({ type, revisionInfo, channel, progress, notes }) => (
  <div className="p-release-details-row">
    <span className="p-release-details-row__type">{type}</span>
    <span className="p-release-details-row__info">
      <span className="p-tooltip--btm-center">
        <b>{revisionInfo.revision}</b> to{" "}
        <span className="p-tooltip__message">
          Version: <b>{revisionInfo.version}</b>
        </span>{" "}
        <b>{channel}</b> on <b>{revisionInfo.architectures.join(", ")}</b>
      </span>
    </span>
    {progress && (
      <Fragment>
        <span className="p-release-details-row__join">to</span>
        <span className="p-release-details-row__progress">{progress}</span>
      </Fragment>
    )}
    {!progress && (
      <Fragment>
        <span />
        <span />
      </Fragment>
    )}
    {notes && (
      <span className="p-release-details__row-notes">
        <small>{notes}</small>
      </span>
    )}
  </div>
);

ReleaseRow.propTypes = {
  type: PropTypes.string,
  revisionInfo: PropTypes.object,
  channel: PropTypes.node,
  progress: PropTypes.node,
  notes: PropTypes.node
};

export default ReleaseRow;
