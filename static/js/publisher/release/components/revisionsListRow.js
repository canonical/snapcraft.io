/* eslint-disable */
import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { format } from "date-fns";

import { canBeReleased } from "../helpers";
import { getChannelString } from "../../../libs/channels";
import { toggleRevision } from "../actions/channelMap";

import {
  getSelectedRevisions,
  isProgressiveReleaseEnabled,
} from "../selectors";

import RevisionLabel from "./revisionLabel";

const ProgressiveProgressChart = ({ current, target }) => {
  return (
    <div className="progressive-progress-bar u-hide--small">
      <div
        className="progressive-progress-bar__inner"
        style={{ width: `${current}%` }}
      ></div>
      <div
        className="progressive-progress-bar__marker"
        style={{ left: `${Math.round(target)}%` }}
      ></div>
    </div>
  );
};

ProgressiveProgressChart.propTypes = {
  current: PropTypes.number,
  target: PropTypes.number,
};

const RevisionsListRow = (props) => {
  const {
    revision,
    isSelectable,
    showChannels,
    showBuildRequest,
    isPending,
    isActive,
    isProgressiveReleaseEnabled,
    progressiveBeingCancelled,
  } = props;

  const releasable = canBeReleased(revision);

  const revisionDate = revision.release
    ? new Date(revision.release.when)
    : new Date(revision.created_at);

  const isSelected = props.selectedRevisions.includes(revision.revision);

  const isProgressive = revision?.progressive?.percentage ? true : false;

  let channel;
  if (revision.release) {
    channel = getChannelString(revision.release);
  }

  function revisionSelectChange() {
    revision.changed = true;
    props.toggleRevision(revision);
  }

  const id = `revision-check-${revision.revision}`;
  const className = `p-revisions-list__row ${isActive ? "is-active" : ""} ${
    isSelectable && releasable ? "is-clickable" : ""
  }`;

  const buildRequestId =
    revision.attributes && revision.attributes["build-request-id"];

  const canShowProgressiveReleases =
    isProgressiveReleaseEnabled && !showChannels && !progressiveBeingCancelled;

  return (
    <tr
      key={id}
      className={className}
      onClick={isSelectable && releasable ? revisionSelectChange : null}
    >
      <td data-heading="Revision">
        {isSelectable ? (
          <label className="p-radio">
            <input
              type="radio"
              checked={isSelected && releasable}
              aria-labelledby={id}
              onChange={revisionSelectChange}
              disabled={!releasable}
              className="p-radio__input"
            />
            &nbsp;
            <span className="p-revisions-list__revision p-radio__label" id={id}>
              <RevisionLabel revision={revision} showTooltip={true} />
            </span>
          </label>
        ) : (
          <span className="p-revisions-list__revision">
            <RevisionLabel revision={revision} showTooltip={true} />{" "}
            {isProgressive && (
              <span style={{ fontWeight: 300 }}>(Progressive)</span>
            )}
          </span>
        )}
      </td>
      <td data-heading="Version">{revision.version}</td>
      {showBuildRequest && (
        <td data-heading="Build request">
          {buildRequestId && <>{buildRequestId}</>}
        </td>
      )}
      {canShowProgressiveReleases &&
        (isProgressive ? (
          <td data-heading="Release progress">
            <ProgressiveProgressChart
              current={revision?.progressive?.["current-percentage"]}
              target={revision?.progressive?.percentage}
            />
            <div className="u-space-between" style={{ maxWidth: "320px" }}>
              <span>
                {Math.round(
                  revision?.progressive?.["current-percentage"]
                    ? revision?.progressive?.["current-percentage"]
                    : 0
                )}
                %
                <br />
                <span className="progressive-chart-key--current p-muted-heading u-hide--small">
                  Current
                </span>
              </span>
              <span>&nbsp;→&nbsp;</span>
              <span className="u-align--right">
                {Math.round(revision?.progressive?.percentage)}%
                <br />
                <span className="progressive-chart-key--target p-muted-heading u-hide--small">
                  Target
                </span>
              </span>
            </div>
          </td>
        ) : (
          <td data-heading="Release progress">-</td>
        ))}

      {showChannels && (
        <td data-heading="Channels">{revision.channels.join(", ")}</td>
      )}
      <td data-heading="Release date">
        {isPending && <em>pending release</em>}
        {!isPending && !progressiveBeingCancelled && (
          <span
            className="p-tooltip p-tooltip--btm-center"
            aria-describedby={`revision-uploaded-${revision.revision}`}
          >
            {format(revisionDate, "dd MMM yyyy")}
            <span
              className="p-tooltip__message u-align--center"
              role="tooltip"
              id={`revision-uploaded-${revision.revision}`}
            >
              {format(revisionDate, "yyyy-MM-dd HH:mm")}
            </span>
          </span>
        )}
      </td>
    </tr>
  );
};

RevisionsListRow.propTypes = {
  // props
  revision: PropTypes.object.isRequired,
  isSelectable: PropTypes.bool,
  showChannels: PropTypes.bool,
  isPending: PropTypes.bool,
  isActive: PropTypes.bool,
  showBuildRequest: PropTypes.bool.isRequired,
  progressiveBeingCancelled: PropTypes.bool,

  // computed state (selectors)
  selectedRevisions: PropTypes.array.isRequired,
  isProgressiveReleaseEnabled: PropTypes.bool,

  // actions
  toggleRevision: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  return {
    selectedRevisions: getSelectedRevisions(state),
    isProgressiveReleaseEnabled: isProgressiveReleaseEnabled(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    toggleRevision: (revision) => dispatch(toggleRevision(revision)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(RevisionsListRow);
