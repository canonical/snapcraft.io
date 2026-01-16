import { useState } from "react";
import { connect } from "react-redux";
import { Row, Col } from "@canonical/react-components";

import { updateProgressiveReleasePercentage } from "../../actions/pendingReleases";
import { isProgressiveReleaseEnabled } from "../../selectors";
import type { PendingReleaseItem, ReleasesReduxState, DispatchFn } from "../../../types/releaseTypes";
import type { Channel } from "../../../types/releaseTypes";

import progressiveTypes from "./types";
import ReleaseRow from "./releaseRow";
import CancelProgressiveRow from "./cancelProgressiveRow";
import ProgressiveBarControl from "../progressiveBarControl";
import ReleaseRowGroup from "./releaseRowGroup";
import CloseChannelsRow from "./closeChannelsRow";

interface UpdatesProps {
  newReleasesToProgress: { [key: string]: PendingReleaseItem };
  progressiveUpdates: { [key: string]: PendingReleaseItem };
  cancelProgressive: { [key: string]: PendingReleaseItem };
  newReleases: { [key: string]: PendingReleaseItem };
  pendingCloses: Channel["name"][];
}

interface ReleasesConfirmDetailsProps {
  updates: UpdatesProps;
  isProgressiveReleaseEnabled?: boolean;
  updateProgressiveReleasePercentage?: (percentage: number) => void;
}

const ReleasesConfirmDetails = ({
  updates,
  isProgressiveReleaseEnabled,
}: ReleasesConfirmDetailsProps) => {
  const [globalPercentage, setGlobalPercentage] = useState(100);

  const progressiveReleases = updates.newReleasesToProgress;
  const progressiveUpdates = updates.progressiveUpdates;
  const progressiveCancellations = updates.cancelProgressive;
  const newReleases = updates.newReleases;
  const pendingCloses = updates.pendingCloses;

  const showProgressiveReleases =
    isProgressiveReleaseEnabled && Object.keys(progressiveReleases).length > 0;
  const showProgressiveUpdates =
    isProgressiveReleaseEnabled && Object.keys(progressiveUpdates).length > 0;
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
    updateProgressiveReleasePercentage(percentage);
  };

  return (
    <div className="p-releases-confirm__details">
      {showProgressiveReleases && (
        <ReleaseRowGroup releases={progressiveReleases} />
      )}
      {showProgressiveUpdates &&
        Object.keys(progressiveUpdates).map((releaseKey) => {
          return (
            <ReleaseRow
              type={progressiveTypes.UPDATE}
              revisionInfo={progressiveUpdates[releaseKey].revision}
              channel={progressiveUpdates[releaseKey].channel}
            />
          );
        })}
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

const mapStateToProps = (state: ReleasesReduxState) => ({
  isProgressiveReleaseEnabled: isProgressiveReleaseEnabled(state),
});

const mapDispatchToProps = (dispatch: DispatchFn) => {
  return {
    updateProgressiveReleasePercentage: (percentage: number) =>
      dispatch(updateProgressiveReleasePercentage(percentage)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ReleasesConfirmDetails);
