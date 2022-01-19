import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { format } from "date-fns";

import { canBeReleased } from "../helpers";
import { getChannelString } from "../../../libs/channels";
import { useDragging, DND_ITEM_REVISIONS, Handle } from "./dnd";
import { toggleRevision } from "../actions/channelMap";

import {
  getSelectedRevisions,
  isProgressiveReleaseEnabled,
} from "../selectors";

import RevisionLabel from "./revisionLabel";
import RevisionsListRowProgressive from "./revisionsListRowProgressive";

const RevisionsListRow = (props) => {
  const {
    revision,
    isSelectable,
    showChannels,
    showBuildRequest,
    isPending,
    isActive,
    isProgressiveReleaseEnabled,
    showProgressive,
    progressiveBeingCancelled,
  } = props;

  const releasable = canBeReleased(revision);

  const [canDrag, setDraggable] = useState(
    !progressiveBeingCancelled && releasable
  );

  const revisionDate = revision.release
    ? new Date(revision.release.when)
    : new Date(revision.created_at);

  const isSelected = props.selectedRevisions.includes(revision.revision);

  let channel;
  if (revision.release) {
    channel = getChannelString(revision.release);
  }

  function revisionSelectChange() {
    props.toggleRevision(revision);
  }

  const [isDragging, isGrabbing, drag] = useDragging({
    item: {
      revisions: [revision],
      architectures: revision.architectures,
      type: DND_ITEM_REVISIONS,
    },
    canDrag: canDrag,
  });

  const id = `revision-check-${revision.revision}`;
  const className = `p-revisions-list__row ${
    progressiveBeingCancelled ? "" : "is-draggable"
  } ${isActive ? "is-active" : ""} ${
    isSelectable && releasable ? "is-clickable" : ""
  } ${
    isPending || isSelected || progressiveBeingCancelled ? "is-pending" : ""
  } ${isGrabbing ? "is-grabbing" : ""} ${isDragging ? "is-dragging" : ""}`;

  const buildRequestId =
    revision.attributes && revision.attributes["build-request-id"];

  const canShowProgressiveReleases =
    isProgressiveReleaseEnabled && !showChannels && !progressiveBeingCancelled;

  return (
    <tr
      ref={drag}
      key={id}
      className={className}
      onClick={isSelectable && releasable ? revisionSelectChange : null}
    >
      <td>{!progressiveBeingCancelled && releasable && <Handle />}</td>
      <td>
        {isSelectable ? (
          <>
            <input
              type="checkbox"
              checked={isSelected && releasable}
              id={id}
              onChange={revisionSelectChange}
              disabled={!releasable}
            />
            <label
              className="p-revisions-list__revision is-inline-label"
              htmlFor={id}
            >
              <RevisionLabel revision={revision} showTooltip={true} />
            </label>
          </>
        ) : (
          <span className="p-revisions-list__revision">
            <RevisionLabel revision={revision} showTooltip={true} />
          </span>
        )}
      </td>
      <td>{revision.version}</td>
      {showBuildRequest && <td>{buildRequestId && <>{buildRequestId}</>}</td>}
      {canShowProgressiveReleases && (
        <td>
          {revision.release && showProgressive && (
            <RevisionsListRowProgressive
              setDraggable={setDraggable}
              channel={channel}
              architecture={revision.release.architecture}
              revision={revision}
            />
          )}
        </td>
      )}
      {progressiveBeingCancelled && (
        <td>
          <em>Cancel progressive release</em>
        </td>
      )}
      {showChannels && <td>{revision.channels.join(", ")}</td>}
      <td>
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
  showProgressive: PropTypes.bool.isRequired,
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
