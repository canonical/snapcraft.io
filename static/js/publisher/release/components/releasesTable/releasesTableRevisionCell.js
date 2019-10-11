import React from "react";
import PropTypes from "prop-types";

import { DND_ITEM_REVISIONS } from "../dnd";

import {
  ReleasesTableCellView,
  RevisionInfo,
  EmptyInfo
} from "./releasesTableCellViews";

const ReleasesTableRevisionCell = props => {
  const { revision, showVersion } = props;

  const item = {
    revisions: [revision],
    architectures: revision ? revision.architectures : [],
    type: DND_ITEM_REVISIONS
  };

  return (
    <ReleasesTableCellView item={item} canDrag={!!revision}>
      {revision ? (
        <RevisionInfo revision={revision} showVersion={showVersion} />
      ) : (
        <EmptyInfo />
      )}
    </ReleasesTableCellView>
  );
};

ReleasesTableRevisionCell.propTypes = {
  revision: PropTypes.object,
  showVersion: PropTypes.bool
};

export default ReleasesTableRevisionCell;
