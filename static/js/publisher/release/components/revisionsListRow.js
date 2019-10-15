import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import distanceInWords from "date-fns/distance_in_words_strict";
import format from "date-fns/format";

import { getChannelString } from "../../../libs/channels.js";
import { useDragging, DND_ITEM_REVISIONS, Handle } from "./dnd";
import { toggleRevision } from "../actions/channelMap";
import { getSelectedRevisions, getProgressiveState } from "../selectors";

import DevmodeRevision from "./devmodeRevision";

const RevisionsListRow = props => {
  const {
    revision,
    isSelectable,
    showChannels,
    showBuildRequest,
    isPending,
    isActive,
    getProgressiveState
  } = props;

  const revisionDate = revision.release
    ? new Date(revision.release.when)
    : new Date(revision.created_at);

  const isSelected = props.selectedRevisions.includes(revision.revision);

  function revisionSelectChange() {
    props.toggleRevision(revision);
  }

  let progressiveState;

  if (revision.release) {
    progressiveState = getProgressiveState(
      getChannelString(revision.release),
      revision.release.architecture,
      revision.revision
    );
  }

  const [isDragging, isGrabbing, drag] = useDragging({
    item: {
      revisions: [revision],
      architectures: revision.architectures,
      type: DND_ITEM_REVISIONS
    }
  });

  const id = `revision-check-${revision.revision}`;
  const className = `p-revisions-list__row is-draggable ${
    isActive ? "is-active" : ""
  } ${isSelectable ? "is-clickable" : ""} ${
    isPending || isSelected ? "is-pending" : ""
  } ${isGrabbing ? "is-grabbing" : ""} ${isDragging ? "is-dragging" : ""}`;

  const buildRequestId =
    revision.attributes && revision.attributes["build-request-id"];

  return (
    <tr
      ref={drag}
      key={id}
      className={className}
      onClick={isSelectable ? revisionSelectChange : null}
    >
      <td>
        <Handle />
      </td>
      <td>
        {isSelectable ? (
          <Fragment>
            <input
              type="checkbox"
              checked={isSelected}
              id={id}
              onChange={revisionSelectChange}
            />
            <label
              className="p-revisions-list__revision is-inline-label"
              htmlFor={id}
            >
              <DevmodeRevision revision={revision} showTooltip={true} />
            </label>
          </Fragment>
        ) : (
          <span className="p-revisions-list__revision">
            <DevmodeRevision revision={revision} showTooltip={true} />
          </span>
        )}
      </td>
      <td>
        {revision.version}
        {progressiveState && <span>{progressiveState.percentage}%</span>}
      </td>
      {showBuildRequest && (
        <td>
          {buildRequestId && (
            <Fragment>
              <i className="p-icon--lp" /> {buildRequestId}
            </Fragment>
          )}
        </td>
      )}
      {showChannels && <td>{revision.channels.join(", ")}</td>}
      <td className="u-align--right">
        {isPending ? (
          <em>pending release</em>
        ) : (
          <span
            className="p-tooltip p-tooltip--btm-center"
            aria-describedby={`revision-uploaded-${revision.revision}`}
          >
            {distanceInWords(new Date(), revisionDate, { addSuffix: true })}
            <span
              className="p-tooltip__message u-align--center"
              role="tooltip"
              id={`revision-uploaded-${revision.revision}`}
            >
              {format(revisionDate, "YYYY-MM-DD HH:mm")}
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

  // computed state (selectors)
  selectedRevisions: PropTypes.array.isRequired,
  getProgressiveState: PropTypes.func,

  // actions
  toggleRevision: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    selectedRevisions: getSelectedRevisions(state),
    getProgressiveState: (channel, arch, revision) =>
      getProgressiveState(state, channel, arch, revision)
  };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleRevision: revision => dispatch(toggleRevision(revision))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RevisionsListRow);
