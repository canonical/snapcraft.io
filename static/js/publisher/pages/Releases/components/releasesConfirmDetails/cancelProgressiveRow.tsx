import React from "react";
import type { PendingReleaseItem } from "../../../../types/releaseTypes";

interface CancelProgressiveRowProps {
  release: PendingReleaseItem;
}

const CancelProgressiveRow = ({ release }: CancelProgressiveRowProps) => {
  const revisionInfo = release.revision;

  return revisionInfo.architectures.map((arch) => {
    const previousRelease = release.previousReleases[0];
    return (
      <div
        className="p-release-details-row is-closing"
        key={`close-${revisionInfo.revision}-${release.channel}`}
      >
        <span>Cancel</span>
        <span>
          <b>{revisionInfo.revision}</b> in <b>{release.channel}</b> on{" "}
          <b>{arch}</b>. Revert to <b>{previousRelease.revision}</b>.
        </span>
      </div>
    );
  });
};

export default CancelProgressiveRow;
