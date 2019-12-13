import React, { Fragment } from "react";
import PropTypes from "prop-types";

import { ProgressiveBar } from "../progressiveBar";

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
        <span className="p-release-details-row__join">to</span>
        <span className="p-release-details-row__progress">
          <ProgressiveBar percentage={100} disabled={true} />
          <span>
            <span className="p-tooltip--btm-center">
              <span className="p-help">100% of devices</span>
              <span className="p-tooltip__message">
                Cannot progressively release to an empty channel
              </span>
            </span>
          </span>
        </span>
      </Fragment>
    )}
    {notes && (
      <span className="p-release-details-row__notes">
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
