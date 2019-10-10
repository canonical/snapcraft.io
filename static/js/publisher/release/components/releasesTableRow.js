import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { getArchitectures, getPendingChannelMap } from "../selectors";
import { ReleasesTableRevisionCell } from "./releasesTableCell";
import { useDragging, DND_ITEM_REVISIONS } from "./dnd";

import { getRevisionsArchitectures } from "../helpers";
import ReleasesTableChannelCell from "./releasesTableChannelCell";

const ReleasesTableRow = props => {
  const {
    currentTrack,
    risk,
    branch,
    archs,
    revisions,
    canDrop,
    children
  } = props;

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

  let hasSameVersion = false;
  let versionsMap = {};

  if (revisions) {
    // calculate map of architectures for each version
    for (const arch in revisions) {
      const revision = revisions[arch];
      const version = revision.version;
      if (!versionsMap[version]) {
        versionsMap[version] = [];
      }
      versionsMap[version].push(arch);
    }

    hasSameVersion = Object.keys(versionsMap).length === 1;
  }

  function renderArch(arch) {
    if (children) {
      return children({ arch, hasSameVersion });
    } else {
      return (
        <ReleasesTableRevisionCell
          key={`${currentTrack}/${risk}/${arch}`}
          revision={revisions ? revisions[arch] : null}
          showVersion={!hasSameVersion}
        />
      );
    }
  }

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

      {archs.map(renderArch)}
    </div>
  );
};

ReleasesTableRow.defaultProps = {
  canDrag: true
};

ReleasesTableRow.propTypes = {
  // props
  risk: PropTypes.string.isRequired,
  branch: PropTypes.object,
  revisions: PropTypes.object,
  children: PropTypes.func,

  // props dnd
  canDrag: PropTypes.bool,
  isOverParent: PropTypes.bool,
  draggedItem: PropTypes.object,
  canDrop: PropTypes.bool,

  // state
  currentTrack: PropTypes.string.isRequired,
  pendingCloses: PropTypes.array.isRequired,
  archs: PropTypes.array.isRequired,
  pendingChannelMap: PropTypes.object
};

const mapStateToProps = state => {
  return {
    currentTrack: state.currentTrack,
    pendingCloses: state.pendingCloses,
    archs: getArchitectures(state),
    pendingChannelMap: getPendingChannelMap(state)
  };
};

export default connect(mapStateToProps)(ReleasesTableRow);
