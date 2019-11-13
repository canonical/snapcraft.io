import React from "react";
import PropTypes from "prop-types";

const ProgressiveConfirm = ({ percentage, newReleases, onChange }) => {
  const releasesCount = Object.keys(newReleases).length;
  return (
    <div className="p-releases-confirm__rollout">
      <label htmlFor="rollout">
        Release{" "}
        <span className="p-tooltip">
          <span className="p-help">
            {releasesCount} revision
            {releasesCount > 1 ? "s" : ""}
          </span>
          <span className="p-tooltip__message" role="tooltip">
            Release revisions:
            <br />
            {Object.keys(newReleases).map(revId => {
              const release = newReleases[revId];

              return (
                <span key={revId}>
                  <b>{release.revision.revision}</b> ({release.revision.version}
                  ) {release.revision.architectures.join(", ")} to{" "}
                  {release.channel}
                  <br />
                </span>
              );
            })}
          </span>
        </span>{" "}
        to{" "}
        <input
          className="p-releases-confirm__rollout-percentage"
          type="number"
          max="100"
          min="1"
          name="rollout-percentage"
          value={percentage}
          onChange={onChange}
        />
        % of devices
      </label>
    </div>
  );
};

ProgressiveConfirm.propTypes = {
  percentage: PropTypes.string,
  newReleases: PropTypes.object,
  onChange: PropTypes.func
};

export default ProgressiveConfirm;
