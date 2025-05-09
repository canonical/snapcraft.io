import PropTypes from "prop-types";

import progressiveTypes from "./types";
import ProgressiveRow from "./progressiveRow";

const ProgressiveRowGroup = ({
  releases,
  globalPercentage,
  updatePercentage,
}) => {
  return (
    <div className="p-release-details-group">
      {Object.keys(releases).map((releaseKey, index) => {
        if (index === 1) {
          return (
            <ProgressiveRow
              release={releases[releaseKey]}
              type={progressiveTypes.RELEASE}
              globalPercentage={globalPercentage}
              key={releaseKey}
            />
          );
        }
        return (
          <ProgressiveRow
            release={releases[releaseKey]}
            type={progressiveTypes.RELEASE}
            globalPercentage={globalPercentage}
            key={releaseKey}
            updateGlobalPercentage={index === 0 ? updatePercentage : null}
          />
        );
      })}
    </div>
  );
};

ProgressiveRowGroup.propTypes = {
  releases: PropTypes.object,
  globalPercentage: PropTypes.number,
  updatePercentage: PropTypes.func,
};

export default ProgressiveRowGroup;
