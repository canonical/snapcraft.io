import React from "react";
import PropTypes from "prop-types";

const ReleasesConfirmActions = ({
  isCancelEnabled,
  cancelPendingReleases,
  isApplyEnabled,
  applyPendingReleases,
  isLoading
}) => (
  <div className="p-releases-confirm__buttons">
    <button
      className="p-button--neutral u-no-margin--bottom"
      disabled={!isCancelEnabled}
      onClick={cancelPendingReleases}
    >
      Revert
    </button>
    <button
      className="p-button--positive is-inline u-no-margin--bottom u-no-margin--right"
      disabled={!isApplyEnabled}
      onClick={applyPendingReleases}
    >
      {isLoading ? "Loading..." : "Save"}
    </button>
  </div>
);

ReleasesConfirmActions.propTypes = {
  isCancelEnabled: PropTypes.bool,
  cancelPendingReleases: PropTypes.func,
  isApplyEnabled: PropTypes.bool,
  applyPendingReleases: PropTypes.func,
  isLoading: PropTypes.bool
};

export default ReleasesConfirmActions;
