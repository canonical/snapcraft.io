import React from "react";
import PropTypes from "prop-types";

const CancelProgressiveRow = ({ release }) => {
  const revisionInfo = release.revision;

  return revisionInfo.architectures.map(arch => {
    const previousRevision = release.previousRevisions[0];
    return (
      <div
        className="p-release-details-row is-closing"
        key={`close-${revisionInfo.revision}-${release.channel}`}
      >
        <span>Cancel</span>
        <span>
          <b>{revisionInfo.revision}</b> in <b>{release.channel}</b> on{" "}
          <b>{arch}</b>. Revert to <b>{previousRevision.revision}</b>.
        </span>
      </div>
    );
  });
};

CancelProgressiveRow.propTypes = {
  release: PropTypes.object
};

export default CancelProgressiveRow;
