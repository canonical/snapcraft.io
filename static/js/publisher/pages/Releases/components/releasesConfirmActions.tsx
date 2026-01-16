import React from "react";

interface ReleasesConfirmActionsProps {
  isCancelEnabled?: boolean;
  cancelPendingReleases?: () => void;
  isApplyEnabled?: boolean;
  applyPendingReleases?: () => void;
  isLoading?: boolean;
}

const ReleasesConfirmActions = ({
  isCancelEnabled,
  cancelPendingReleases,
  isApplyEnabled,
  applyPendingReleases,
  isLoading,
}: ReleasesConfirmActionsProps) => (
  <div className="p-releases-confirm__buttons u-align--right">
    <button
      className="u-no-margin--bottom u-no-margin--right"
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

export default ReleasesConfirmActions;
