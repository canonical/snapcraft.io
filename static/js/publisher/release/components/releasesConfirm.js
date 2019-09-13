import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { cancelPendingReleases } from "../actions/pendingReleases";

class ReleasesConfirm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      rolloutType: "all",
      rolloutPercentage: 10
    };
  }

  onRevertClick() {
    this.props.cancelPendingReleases();
  }

  onApplyClick() {
    const { rolloutType, rolloutPercentage } = this.state;
    this.props.releaseRevisions(
      rolloutType === "percentage" ? rolloutPercentage : null
    );
  }

  onRolloutTypeClick(type) {
    this.setState({
      rolloutType: type
    });
  }

  onRolloutPercentageChange() {
    this.setState({
      rolloutPercentage: parseInt(this.percentageInput.value)
    });
  }

  render() {
    const {
      pendingReleases,
      pendingCloses,
      channelMap,
      isLoading
    } = this.props;
    const { rolloutType, rolloutPercentage } = this.state;
    const releasesCount = Object.keys(pendingReleases).length;
    const closesCount = pendingCloses.length;

    const phasableReleases = {};
    Object.keys(pendingReleases).forEach(revision => {
      const release = pendingReleases[revision];
      const channel = release.channels[0];
      const architecture = release.revision.architectures[0];

      const hasRelease =
        channelMap[channel] && channelMap[channel][architecture];

      const isInChannelMap =
        hasRelease && channelMap[channel][architecture].revision === revision;

      if (hasRelease && !isInChannelMap) {
        phasableReleases[revision] = release;
      }
    });

    const phasableReleasesCount = Object.keys(phasableReleases).length;

    return (
      (releasesCount > 0 || closesCount > 0) && (
        <div className="p-releases-confirm">
          <p className="u-no-margin--bottom">
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
          </p>
          {phasableReleasesCount > 0 && (
            <div className="p-releases-confirm__rollout">
              <p className="u-no-margin--bottom">
                Release{" "}
                <span className="p-tooltip">
                  <span className="p-help">
                    {phasableReleasesCount} revision
                    {phasableReleasesCount > 1 ? "s" : ""}
                  </span>
                  <span className="p-tooltip__message" role="tooltip">
                    Revisions that can be phased:
                    <br />
                    {Object.keys(phasableReleases).map(revision => {
                      const release = phasableReleases[revision];

                      return (
                        <span key={revision}>
                          <b>{release.revision.revision}</b> (
                          {release.revision.version}){" "}
                          {release.revision.architectures[0]} to{" "}
                          {release.channels[0]}
                          {"\n"}
                        </span>
                      );
                    })}
                  </span>
                </span>{" "}
                to:
              </p>
              <input
                type="radio"
                id="all-devices"
                name="rollout"
                value="all"
                checked={rolloutType === "all"}
                onChange={this.onRolloutTypeClick.bind(this, "all")}
              />
              <label htmlFor="all-devices">all devices</label>
              <input
                type="radio"
                id="rollout"
                name="rollout"
                value="percentage"
                checked={rolloutType === "percentage"}
                onChange={this.onRolloutTypeClick.bind(this, "percentage")}
              />
              <label htmlFor="rollout">
                <input
                  className="p-releases-confirm__rollout-percentage"
                  type="number"
                  max="100"
                  min="1"
                  name="rollout-percentage"
                  value={rolloutPercentage}
                  onChange={this.onRolloutPercentageChange.bind(this)}
                  onFocus={this.onRolloutTypeClick.bind(this, "percentage")}
                  ref={input => (this.percentageInput = input)}
                />
                % of devices
              </label>
            </div>
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
  isLoading: PropTypes.bool.isRequired,

  releaseRevisions: PropTypes.func.isRequired,
  cancelPendingReleases: PropTypes.func.isRequired,
  channelMap: PropTypes.object.isRequired
};

const mapStateToProps = state => {
  return {
    pendingCloses: state.pendingCloses,
    pendingReleases: state.pendingReleases,
    channelMap: state.channelMap
  };
};

const mapDispatchToProps = dispatch => {
  return {
    cancelPendingReleases: () => dispatch(cancelPendingReleases())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesConfirm);
