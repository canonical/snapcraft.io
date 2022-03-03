import React from "react";
import PropTypes from "prop-types";

import { DND_ITEM_REVISIONS } from "../dnd";

import { canBeReleased } from "../../helpers";
import { ReleasesTableCellView, RevisionInfo, EmptyInfo } from "./cellViews";

// releases table cell with data for a specific revision (unrelated to channel map)
const ReleasesTableRevisionCell = (props) => {
  const { revision } = props;

  const item = {
    revisions: [revision],
    architectures: revision ? revision.architectures : [],
    type: DND_ITEM_REVISIONS,
  };

  return (
    <ReleasesTableCellView
      item={item}
      canDrag={!!revision && canBeReleased(revision)}
      cellType="revision"
    >
      {revision ? <RevisionInfo revision={revision} /> : <EmptyInfo />}
    </ReleasesTableCellView>
  );
};

ReleasesTableRevisionCell.propTypes = {
  revision: PropTypes.object,
  showVersion: PropTypes.bool,
};

export default ReleasesTableRevisionCell;
