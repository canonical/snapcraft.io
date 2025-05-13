import { useState } from "react";
import { connect } from "react-redux";
import { Row, Col } from "@canonical/react-components";
import PropTypes from "prop-types";

import { updateProgressiveReleasePercentage } from "../../actions/pendingReleases";
import { isProgressiveReleaseEnabled } from "../../selectors";

import progressiveTypes from "./types";
import ReleaseRow from "./releaseRow";
import CancelProgressiveRow from "./cancelProgressiveRow";
import ProgressiveBarControl from "../progressiveBarControl";
import ReleaseRowGroup from "./releaseRowGroup";
import CloseChannelsRow from "./closeChannelsRow";

const ReleasesConfirmDetails = ({ updates, isProgressiveReleaseEnabled }) => {
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

  const updatePercentage = (percentage) => {
    setGlobalPercentage(percentage);
    updateProgressiveReleasePercentage(percentage);
  };

  const newReleasesByChannel = {};

  Object.keys(newReleases).forEach((key) => {
    const release = newReleases[key];
    const channel = release.channel;

    if (newReleasesByChannel[channel]) {
      newReleasesByChannel[channel].push(release);
    } else {
      newReleasesByChannel[channel] = [release];
    }
  });

  return (
    <div className="p-releases-confirm__details">
      {showProgressiveReleases && (
        <ReleaseRowGroup releases={progressiveReleases} />
      )}
      {showProgressiveUpdates &&
        Object.keys(progressiveUpdates).map((releaseKey) => {
          return (
            <ReleaseRow
              key={releaseKey}
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
        Object.keys(newReleasesByChannel).map((key) => {
          const newRelease = newReleasesByChannel[key];

          return (
            <>
              <h3 className="p-muted-heading">{key}</h3>
              {Object.keys(newRelease).map((releaseKey) => {
                const release = newRelease[releaseKey];
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
            </>
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
            />
          </Col>
        </Row>
      )}
      {showPendingCloses && <CloseChannelsRow channels={pendingCloses} />}
    </div>
  );
};

ReleasesConfirmDetails.propTypes = {
  updates: PropTypes.object.isRequired,
  isProgressiveReleaseEnabled: PropTypes.bool,
  updateProgressiveReleasePercentage: PropTypes.func,
};

const mapStateToProps = (state) => ({
  isProgressiveReleaseEnabled: isProgressiveReleaseEnabled(state),
});

const mapDispatchToProps = (dispatch) => {
  return {
    updateProgressiveReleasePercentage: (percentage) =>
      dispatch(updateProgressiveReleasePercentage(percentage)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ReleasesConfirmDetails);
