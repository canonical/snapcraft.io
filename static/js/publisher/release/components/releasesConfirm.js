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

    const timestamp = new Date().getTime();

    this.state = {
      isLoading: false,
      percentage: 100,
      progressiveKey: `progressive-release-${timestamp}`
    };
  }

  onRevertClick() {
    this.props.cancelPendingReleases();
  }

  onApplyClick() {
    this.setState({
      isLoading: true
    });
    this.props.releaseRevisions().then(() => {
      this.setState({
        isLoading: false
      });
    });
  }

  onPercentageChange(event) {
    this.setState(
      {
        percentage: +event.target.value
      },
      () => {
        this.props.setProgressiveReleasePercentage(
          this.state.progressiveKey,
          this.state.percentage
        );
      }
    );
  }

  // TODO:
  // - only affects revisions that are released over something else
  // - show which revisions will be affected by %

  render() {
    const { isLoading } = this.state;
    const {
      pendingReleases,
      pendingCloses,
      isProgressiveReleaseEnabled
    } = this.props;
    const releasesCount = Object.keys(pendingReleases).length;
    const closesCount = pendingCloses.length;

    return (
      (releasesCount > 0 || closesCount > 0) && (
        <div className="p-releases-confirm">
          <div>
            {releasesCount > 0 && (
              <Fragment>
                <span className="p-tooltip">
                  <span className="p-help">
                    {releasesCount} revision
                    {releasesCount > 1 ? "s" : ""}
                  </span>
                  <span className="p-tooltip__message" role="tooltip">
                    Release revisions:
                    <br />
                    {Object.keys(pendingReleases).map(revId => {
                      const release = pendingReleases[revId];

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
            )}
          </div>
          {isProgressiveReleaseEnabled && (
            <ProgressiveConfirm
              percentage={this.state.percentage}
              onChange={this.onPercentageChange.bind(this)}
            />
          )}
          <div className="p-releases-confirm__buttons">
            <button
              className="p-button--positive is-inline u-no-margin--bottom"
              disabled={isLoading}
              onClick={this.onApplyClick.bind(this)}
            >
              {isLoading ? "Loading..." : "Apply"}
            </button>
            <button
              className="p-button--neutral u-no-margin--bottom u-no-margin--right"
              disabled={isLoading}
              onClick={this.onRevertClick.bind(this)}
            >
              Cancel
            </button>
          </div>
        </div>
      )
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
