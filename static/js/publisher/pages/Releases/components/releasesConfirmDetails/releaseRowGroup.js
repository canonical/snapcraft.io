import PropTypes from "prop-types";

import progressiveTypes from "./types";
import ReleaseRow from "./releaseRow";

const ReleaseRowGroup = ({ releases }) => {
  return (
    <div className="p-release-details-group">
      {releases.map((release) => {
        return (
          <ReleaseRow
            type={progressiveTypes.RELEASE}
            revisionInfo={release.revision}
            channel={release.channel}
            key={release.channel}
          />
        );
      })}
    </div>
  );
};

ReleaseRowGroup.propTypes = {
  releases: PropTypes.array,
};

export default ReleaseRowGroup;
