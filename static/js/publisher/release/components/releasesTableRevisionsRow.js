import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { getArchitectures, getPendingChannelMap } from "../selectors";
import ReleasesTableCell, {
  ReleasesTableRevisionCell
} from "./releasesTableCell";
import { useDragging, DND_ITEM_REVISIONS } from "./dnd";

import { getRevisionsArchitectures } from "../helpers";
import ReleasesTableChannelCell from "./releasesTableChannelCell";

const ReleasesTableRevisionsRow = props => {
  const { currentTrack, risk, branch, archs, revisions, isChannel } = props;
  const { canDrop, draggedItem, isOverParent } = props;

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

      {archs.map(
        arch =>
          !isChannel ? (
            <ReleasesTableRevisionCell
              key={`${currentTrack}/${risk}/${arch}`}
              revision={revisions[arch]}
              showVersion={!hasSameVersion}
            />
          ) : (
            <ReleasesTableCell
              key={`${currentTrack}/${risk}/${arch}`}
              track={currentTrack}
              risk={risk}
              branch={branch}
              arch={arch}
              showVersion={!hasSameVersion}
              isOverParent={
                isOverParent &&
                canDrop &&
                draggedItem.architectures.indexOf(arch) !== -1
              }
            />
          )
      )}
    </div>
  );
};

ReleasesTableRevisionsRow.defaultProps = {
  canDrag: true,
  isChannel: false
};

ReleasesTableRevisionsRow.propTypes = {
  // props
  risk: PropTypes.string.isRequired,
  branch: PropTypes.object,
  revisions: PropTypes.object,
  isChannel: PropTypes.bool,

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

export default connect(mapStateToProps)(ReleasesTableRevisionsRow);
