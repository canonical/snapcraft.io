import { connect } from "react-redux";
import { v4 as uuidv4 } from "uuid";
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

  const groupReleasesByChannel = (releases) => {
    const releasesByChannel = {};
    Object.keys(releases).forEach((key) => {
      const release = releases[key];
      const channel = release.channel;

      if (releasesByChannel[channel]) {
        releasesByChannel[channel].releases.push(release);
      } else {
        releasesByChannel[channel] = {
          releases: [release],
          percentage: release.progressive.percentage,
        };
      }
    });

    return releasesByChannel;
  };

  const newReleasesByChannel = groupReleasesByChannel(newReleases);
  const progressiveReleasesByChannel =
    groupReleasesByChannel(progressiveReleases);

  const orderReleaseByRisk = (releases) => {
    const riskOrder = ["stable", "candidate", "beta", "edge"];
    const orderedReleases = {};

    const sortedKeys = Object.keys(releases).sort((a, b) => {
      const aRiskName = a.split("/")[1];
      const bRiskName = b.split("/")[1];

      return riskOrder.indexOf(aRiskName) > riskOrder.indexOf(bRiskName)
        ? 1
        : -1;
    });

    sortedKeys.forEach((channelName) => {
      orderedReleases[channelName] = releases[channelName];
    });

    return orderedReleases;
  };

  return (
    <div className="p-releases-confirm__details">
      {showProgressiveUpdates &&
        Object.keys(progressiveUpdates).map((releaseKey) => {
          return (
            <ReleaseRow
              key={releaseKey}
              type={progressiveTypes.UPDATE}
              revisionInfo={progressiveUpdates[releaseKey].revision}
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

      {showProgressiveReleases &&
        Object.keys(orderReleaseByRisk(progressiveReleasesByChannel)).map(
          (key) => {
            const releases = progressiveReleasesByChannel[key].releases;
            const uniqueKey = uuidv4();

            return (
              <div className="p-releases-channel-group" key={uniqueKey}>
                <h3 className="p-muted-heading u-no-margin--bottom">{key}</h3>
                <ReleaseRowGroup releases={releases} />
                <Row>
                  <Col size={6}>
                    <ProgressiveBarControl
                      releases={releases}
                      target={progressiveReleasesByChannel[key].percentage}
                    />
                  </Col>
                </Row>
              </div>
            );
          },
        )}

      {showNewReleases &&
        Object.keys(orderReleaseByRisk(newReleasesByChannel)).map((key) => {
          const newRelease = newReleasesByChannel[key].releases;

          return (
            <div className="p-releases-channel-group" key={key}>
              <h3 className="p-muted-heading u-no-margin--bottom">{key}</h3>
              {Object.keys(newRelease).map((releaseKey) => {
                const release = newRelease[releaseKey];
                const revisionInfo = release.revision;
                const channel = release.channel;

                return (
                  <ReleaseRow
                    type="Release"
                    revisionInfo={revisionInfo}
                    key={`${revisionInfo.revision}-{${channel}`}
                  />
                );
              })}
            </div>
          );
        })}

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
