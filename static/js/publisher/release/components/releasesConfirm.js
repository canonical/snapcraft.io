import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ReleasesConfirmDetails from "./releasesConfirmDetails/";

import {
  cancelPendingReleases,
  setProgressiveReleasePercentage
} from "../actions/pendingReleases";
import { releaseRevisions } from "../actions/releases";
import { getSeparatePendingReleases } from "../selectors";

class ReleasesConfirm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      showDetails: false
    };
  }

  onRevertClick() {
    this.props.cancelPendingReleases();
    this.setState({
      showDetails: false
    });
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
        showDetails: false
      });
    });
  }

  onPercentageChange(event) {
    this.setState({
      percentage: event.target.value
    });
  }

  toggleDetails() {
    this.setState({
      showDetails: !this.state.showDetails
    });
  }

  render() {
    const { isLoading, showDetails } = this.state;
    const { updates } = this.props;

    const updatesCount = Object.keys(updates).reduce((acc, update) => {
      if (Array.isArray(updates[update])) {
        //pendingCloses are an array
        return acc + updates[update].length;
      } else {
        return acc + Object.keys(updates[update]).length;
      }
    }, 0);

    const isApplyEnabled = updatesCount > 0 && !isLoading;

    const isCancelEnabled = updatesCount > 0 && !isLoading;

    return (
      <Fragment>
        <div className="p-releases-confirm">
          {showDetails && <ReleasesConfirmDetails updates={updates} />}
          <div className="row u-vertically-center">
            <div className="col-6">
              {updatesCount > 0 && (
                <Fragment>
                  {updatesCount} update
                  {updatesCount > 1 ? "s" : ""}
                </Fragment>
              )}
            </div>
            <div className="col-6 p-releases-confirm__actions">
              {updatesCount > 0 && (
                <div
                  className={`p-releases-confirm__details-toggle ${
                    showDetails ? "is-open" : ""
                  }`}
                >
                  <p className="u-no-margin--bottom">
                    <span onClick={this.toggleDetails.bind(this)}>
                      {showDetails ? "Hide" : "Show"} details{" "}
                      <i className="p-icon--contextual-menu" />
                    </span>
                  </p>
                </div>
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
        </div>
      </Fragment>
    );
  }
}

ReleasesConfirm.propTypes = {
  updates: PropTypes.object.isRequired,

  releaseRevisions: PropTypes.func.isRequired,
  cancelPendingReleases: PropTypes.func.isRequired,
  setProgressiveReleasePercentage: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    updates: {
      ...getSeparatePendingReleases(state),
      pendingCloses: state.pendingCloses
    }
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
