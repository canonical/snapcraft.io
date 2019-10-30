import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import {
  cancelPendingReleases,
  setProgressiveReleasePercentage
} from "../actions/pendingReleases";
import { releaseRevisions } from "../actions/releases";
import { isProgressiveReleaseEnabled } from "../selectors";

import ProgressiveConfirm from "./progressiveConfirm";

class ReleasesConfirm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      percentage: "100"
    };
  }

  onRevertClick() {
    this.props.cancelPendingReleases();
  }

  onApplyClick() {
    this.setState({
      isLoading: true
    });

    if (this.state.percentage && +this.state.percentage !== 100) {
      const timestamp = new Date().getTime();

      this.props.setProgressiveReleasePercentage(
        `progressive-release-${timestamp}`,
        +this.state.percentage
      );
    }

    this.props.releaseRevisions().then(() => {
      this.setState({
        isLoading: false,
        percentage: "100"
      });
    });
  }

  onPercentageChange(event) {
    this.setState({
      percentage: event.target.value
    });
  }

  render() {
    const { isLoading, percentage } = this.state;
    const {
      pendingReleases,
      pendingCloses,
      isProgressiveReleaseEnabled
    } = this.props;
    const closesCount = pendingCloses.length;

    const isPercentageValid = +percentage > 0 && +percentage <= 100;

    const isApplyEnabled =
      (releasesCount > 0 || closesCount > 0) && !isLoading && isPercentageValid;

    const isCancelEnabled =
      (releasesCount > 0 || closesCount > 0) && !isLoading;

    const progressiveUpdates = {};
    const newReleases = {};

    Object.keys(pendingReleases).forEach(key => {
      if (pendingReleases[key].progressive) {
        progressiveUpdates[key] = pendingReleases[key];
      } else {
        newReleases[key] = pendingReleases[key];
      }
    });

    const progressiveUpdatesCount = Object.keys(progressiveUpdates).length;
    const releasesCount = Object.keys(newReleases).length;

    const showProgressive = isProgressiveReleaseEnabled && releasesCount > 0;

    return (
      <div className="p-releases-confirm u-vertically-center row">
        <div className="col-5">
          {releasesCount > 0 &&
            !showProgressive && (
              <Fragment>
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
                          <b>{release.revision.revision}</b> (
                          {release.revision.version}){" "}
                          {release.revision.architectures.join(", ")} to{" "}
                          {release.channels.join(", ")}
                          {"\n"}
                        </span>
                      );
                    })}
                  </span>
                </span>{" "}
                to release.
              </Fragment>
            )}{" "}
          {closesCount > 0 && (
            <Fragment>
              <span className="p-tooltip">
                <span className="p-help">
                  {closesCount} channel
                  {closesCount > 1 ? "s" : ""}
                </span>
                <span className="p-tooltip__message" role="tooltip">
                  Close channels: {pendingCloses.join(", ")}
                </span>
              </span>{" "}
              to close.
            </Fragment>
          )}{" "}
          {progressiveUpdatesCount > 0 && (
            <Fragment>
              <span className="p-tooltip">
                <span className="p-help">
                  {progressiveUpdatesCount} release
                  {progressiveUpdatesCount > 1 ? "s" : ""}
                </span>
                <span className="p-tooltip__message" role="tooltip">
                  Progressive release update
                  {progressiveUpdatesCount > 1 ? "s" : ""}:<br />
                  {Object.keys(progressiveUpdates).map(revId => {
                    const release = progressiveUpdates[revId];

                    return (
                      <span key={revId}>
                        Revision <b>{release.revision.revision}</b> on{" "}
                        {release.revision.architectures[0]} -{" "}
                        {release.channels[0]} to{" "}
                        <b>{release.progressive.percentage}%</b>
                        {"\n"}
                      </span>
                    );
                  })}
                </span>
              </span>{" "}
              to update
            </Fragment>
          )}
        </div>
        <div className="col-7 p-releasses-confirm__actions">
          {showProgressive && (
            <ProgressiveConfirm
              percentage={this.state.percentage}
              newReleases={newReleases}
              onChange={this.onPercentageChange.bind(this)}
            />
          )}
          <div className="p-releases-confirm__buttons">
            <button
              className="p-button--neutral u-no-margin--bottom"
              disabled={!isCancelEnabled}
              onClick={this.onRevertClick.bind(this)}
            >
              Revert
            </button>
            <button
              className="p-button--positive is-inline u-no-margin--bottom u-no-margin--right"
              disabled={!isApplyEnabled}
              onClick={this.onApplyClick.bind(this)}
            >
              {isLoading ? "Loading..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

ReleasesConfirm.propTypes = {
  pendingReleases: PropTypes.object.isRequired,
  pendingCloses: PropTypes.array.isRequired,
  isProgressiveReleaseEnabled: PropTypes.bool.isRequired,

  releaseRevisions: PropTypes.func.isRequired,
  cancelPendingReleases: PropTypes.func.isRequired,
  setProgressiveReleasePercentage: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    pendingCloses: state.pendingCloses,
    pendingReleases: state.pendingReleases,
    isProgressiveReleaseEnabled: isProgressiveReleaseEnabled(state)
  };
};

const mapDispatchToProps = dispatch => {
  return {
    releaseRevisions: () => dispatch(releaseRevisions()),
    cancelPendingReleases: () => dispatch(cancelPendingReleases()),
    setProgressiveReleasePercentage: (key, percentage) =>
      dispatch(setProgressiveReleasePercentage(key, percentage))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesConfirm);
