import PropTypes from "prop-types";
import { v4 as uuidv4 } from "uuid";

import progressiveTypes from "./types";
import ReleaseRow from "./releaseRow";

const ReleaseRowGroup = ({ releases }) => {
  return (
    <div className="p-release-details-group">
      {releases.map((release) => {
        const key = uuidv4();

        return (
          <ReleaseRow
            type={progressiveTypes.RELEASE}
            revisionInfo={release.revision}
            channel={release.channel}
            key={key}
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
