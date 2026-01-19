import type { PendingReleaseItem } from "../../../../types/releaseTypes";

import progressiveTypes from "./types";
import ReleaseRow from "./releaseRow";

interface ReleaseRowGroupProps {
  releases: { [key: string]: PendingReleaseItem };
}

const ReleaseRowGroup = ({ releases }: ReleaseRowGroupProps) => {
  return (
    <div className="p-release-details-group">
      {Object.keys(releases).map((releaseKey) => {
        return (
          <ReleaseRow
            type={progressiveTypes.RELEASE}
            revisionInfo={releases[releaseKey].revision}
            channel={releases[releaseKey].channel}
            key={releaseKey}
          />
        );
      })}
    </div>
  );
};

export default ReleaseRowGroup;
