import PropTypes from "prop-types";

import progressiveTypes from "./types";
import ReleaseRow from "./releaseRow";

const ReleaseRowGroup = ({ releases }) => {
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

ReleaseRowGroup.propTypes = {
  releases: PropTypes.object,
};

export default ReleaseRowGroup;
