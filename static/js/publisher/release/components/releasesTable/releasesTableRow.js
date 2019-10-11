import React from "react";
import PropTypes from "prop-types";

import { useDragging, DND_ITEM_REVISIONS } from "../dnd";

import { getRevisionsArchitectures } from "../../helpers";
import ReleasesTableChannelCell from "./releasesTableChannelCell";

const ReleasesTableRow = props => {
  const { risk, branch, revisions, canDrop, children } = props;

  const canDrag = !!revisions && props.canDrag;

  const draggedRevisions = canDrag ? Object.values(revisions) : [];

  const [isDragging, isGrabbing, drag, preview] = useDragging({
    item: {
      revisions: draggedRevisions,
      architectures: getRevisionsArchitectures(draggedRevisions),
      risk,
      branch: branch ? branch.branch : null,
      type: DND_ITEM_REVISIONS
    },
    canDrag
  });

  return (
    <div
      ref={preview}
      className={`p-releases-table__row p-releases-table__row--${
        branch ? "branch" : "channel"
      } p-releases-table__row--${risk} ${isDragging ? "is-dragging" : ""} ${
        isGrabbing ? "is-grabbing" : ""
      } ${canDrop ? "can-drop" : ""}`}
    >
      <ReleasesTableChannelCell
        drag={drag}
        risk={risk}
        branch={branch}
        revisions={revisions}
      />
      {children}
    </div>
  );
};

ReleasesTableRow.defaultProps = {
  canDrag: true
};

ReleasesTableRow.propTypes = {
  risk: PropTypes.string.isRequired,
  branch: PropTypes.object,
  revisions: PropTypes.object,
  children: PropTypes.node,

  canDrag: PropTypes.bool,
  canDrop: PropTypes.bool
};

export default ReleasesTableRow;
