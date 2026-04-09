import { useState } from "react";
import { connect } from "react-redux";
import { Row, Col } from "@canonical/react-components";

import { updateProgressiveRelease } from "../../slices/pendingChanges";
import { isProgressiveReleaseEnabled, type SeparatePendingReleases } from "../../selectors";
import type { Progressive, ReleasesReduxState } from "../../../../types/releaseTypes";
import type { AppDispatch } from "../../store";

import progressiveTypes from "./types";
import ReleaseRow from "./releaseRow";
import CancelProgressiveRow from "./cancelProgressiveRow";
import ProgressiveBarControl from "../progressiveBarControl";
import ReleaseRowGroup from "./releaseRowGroup";
import CloseChannelsRow from "./closeChannelsRow";

interface OwnProps {
  updates: SeparatePendingReleases & {
    pendingCloses: ReleasesReduxState["pendingChanges"]["pendingCloses"];
  };
}

interface StateProps {
  isProgressiveReleaseEnabled?: boolean;
}

interface DispatchProps {
  updateProgressiveRelease?: (percentage: Progressive) => void;
}

type ReleasesConfirmDetailsProps = OwnProps & StateProps & DispatchProps;

const ReleasesConfirmDetails = ({
  updates,
  isProgressiveReleaseEnabled,
}: ReleasesConfirmDetailsProps) => {
  const [globalPercentage, setGlobalPercentage] = useState(100);

  const progressiveReleases = updates.newReleasesToProgress;
  const progressiveCancellations = updates.cancelProgressive;
  const newReleases = updates.newReleases;
  const pendingCloses = Object.values(updates.pendingCloses);

  const showProgressiveReleases =
    isProgressiveReleaseEnabled && Object.keys(progressiveReleases).length > 0;
  const showProgressiveCancellations =
    isProgressiveReleaseEnabled &&
    Object.keys(progressiveCancellations).length > 0;
  const showNewReleases = Object.keys(newReleases).length > 0;
  const showPendingCloses = pendingCloses.length > 0;

  // Find the highest release target percentage among previous progressive releases:
  // this will be the lowest percentage for the new release
  const lowestPercentage = Object.values(updates.newReleasesToProgress).reduce(
    (max, release) => {
      const previousRelease = release.previousReleases?.[0];
      if (previousRelease?.revision !== release.revision.revision) {
        return max;
      }
      const percentage =
        previousRelease?.releases?.[0]?.progressive?.percentage || 1;

      if (percentage > max) {
        return percentage;
      }

      return max;
    },
    1,
  );

  const updatePercentage = (percentage: number) => {
    setGlobalPercentage(percentage);
    updateProgressiveRelease({ percentage, "current-percentage": null });
  };

  return (
    <div className="p-releases-confirm__details">
      {showProgressiveReleases && (
        <ReleaseRowGroup releases={progressiveReleases} />
      )}
      {showProgressiveCancellations &&
        Object.keys(progressiveCancellations).map((releaseKey) => {
          return (
            <CancelProgressiveRow
              release={progressiveCancellations[releaseKey]}
              key={releaseKey}
            />
          );
        })}
      {showNewReleases &&
        Object.keys(newReleases).map((releaseKey) => {
          const release = newReleases[releaseKey];
          const revisionInfo = release.revision;
          const channel = release.channel;

          return (
            <ReleaseRow
              type="Release"
              revisionInfo={revisionInfo}
              channel={channel}
              key={`${revisionInfo.revision}-{${channel}`}
            />
          );
        })}
      {showProgressiveReleases && (
        <Row>
          <Col size={6}>
            <ProgressiveBarControl
              globalPercentage={globalPercentage}
              type={progressiveTypes.RELEASE}
              release={progressiveReleases[Object.keys(progressiveReleases)[0]]}
              updateGlobalPercentage={updatePercentage}
              minPercentage={lowestPercentage}
            />
          </Col>
        </Row>
      )}
      {showPendingCloses && <CloseChannelsRow channels={pendingCloses} />}
    </div>
  );
};

const mapStateToProps = (state: ReleasesReduxState): StateProps => ({
  isProgressiveReleaseEnabled: isProgressiveReleaseEnabled(state),
});

const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => {
  return {
    updateProgressiveRelease: (percentage: Progressive) =>
      dispatch(updateProgressiveRelease(percentage)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ReleasesConfirmDetails);
