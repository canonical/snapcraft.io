import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import distanceInWords from "date-fns/distance_in_words_strict";
import format from "date-fns/format";

import { useDragging, DND_ITEM_REVISION } from "./dnd";
import { toggleRevision } from "../actions/channelMap";
import { getSelectedRevisions } from "../selectors";

import DevmodeIcon from "./devmodeIcon";

const RevisionsListRow = props => {
  const { revision, isSelectable, showAllColumns, isPending } = props;

  const revisionDate = revision.release
    ? new Date(revision.release.when)
    : new Date(revision.created_at);

  const isSelected = props.selectedRevisions.includes(revision.revision);

  function revisionSelectChange() {
    props.toggleRevision(revision);
  }

  const [isDragging, isGrabbing, drag] = useDragging({
    item: {
      revision: revision,
      // TODO:
      // we are assuming single arcitecture here,
      // this may be trickier for revisions in multiple architectures
      arch: revision.architectures[0],
      type: DND_ITEM_REVISION
    }
  });

  const id = `revision-check-${revision.revision}`;
  const className = `is-draggable ${isSelectable ? "is-clickable" : ""} ${
    isPending || isSelected ? "is-pending" : ""
  } ${isGrabbing ? "is-grabbing" : ""} ${isDragging ? "is-dragging" : ""}`;

  return (
    <tr
      ref={drag}
      key={id}
      className={className}
      onClick={isSelectable ? revisionSelectChange : null}
    >
      <td>
        <span className="p-releases__handle">
          <i className="p-icon--drag" />
        </span>
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
            <label className="u-no-margin--bottom" htmlFor={id}>
              {revision.revision}
            </label>
          </Fragment>
        ) : (
          <span>{revision.revision}</span>
        )}
      </td>
      <td>
        <DevmodeIcon revision={revision} showTooltip={true} />
      </td>
      <td>{revision.version}</td>
      {showAllColumns && <td>{revision.channels.join(", ")}</td>}
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
  showAllColumns: PropTypes.bool,
  isPending: PropTypes.bool,

  // computed state (selectors)
  selectedRevisions: PropTypes.array.isRequired,

  // actions
  toggleRevision: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    selectedRevisions: getSelectedRevisions(state)
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
