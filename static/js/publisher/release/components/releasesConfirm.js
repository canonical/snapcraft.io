import React, { Component, createRef } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import debounce from "../../../libs/debounce";

import ReleasesConfirmDetails from "./releasesConfirmDetails/";
import ReleasesConfirmActions from "./releasesConfirmActions";

import {
  cancelPendingReleases,
  setProgressiveReleasePercentage,
} from "../actions/pendingReleases";
import { releaseRevisions } from "../actions/releases";
import { triggerGAEvent } from "../actions/gaEventTracking";
import { getSeparatePendingReleases } from "../selectors";

class ReleasesConfirm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      showDetails: false,
    };

    this.stickyBar = createRef();
  }

  componentDidMount() {
    document.addEventListener(
      "scroll",
      debounce(() => {
        const stickyBarRec = this.stickyBar.current.getBoundingClientRect();
        const top = stickyBarRec.top;
        const scrollX = window.scrollX;
        const topPosition = top + scrollX;

        this.stickyBar.current.classList.toggle("is-pinned", topPosition === 0);
      }),
      500
    );
  }

  onRevertClick() {
    this.props.triggerGAEvent("click-revert");
    this.props.cancelPendingReleases();
    this.setState({
      showDetails: false,
    });
  }

  onApplyClick() {
    this.props.triggerGAEvent("click-save");

    this.setState({
      isLoading: true,
    });

    if (this.state.percentage && +this.state.percentage !== 100) {
      this.props.setProgressiveReleasePercentage(+this.state.percentage);
    }

    this.props.releaseRevisions().then(() => {
      this.setState({
        isLoading: false,
        showDetails: false,
      });
    });
  }

  onPercentageChange(event) {
    this.setState({
      percentage: event.target.value,
    });
  }

  toggleDetails() {
    this.props.triggerGAEvent(
      `click-${this.state.showDetails ? "hide" : "show"}-details`
    );
    this.setState({
      showDetails: !this.state.showDetails,
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
      <>
        <div
          className={`p-releases-confirm ${updatesCount > 0 ? "" : "u-hide"}`}
          ref={this.stickyBar}
        >
          <div className="u-fixed-width">
            <div className="row u-vertically-center p-releases-row">
              <div className="col-6">
                {updatesCount > 0 && (
                  <>
                    <button
                      type="button"
                      className="p-button--base u-no-margin--bottom has-icon"
                      onClick={this.toggleDetails.bind(this)}
                    >
                      <i
                        className={`${
                          showDetails
                            ? "p-icon--chevron-up"
                            : "p-icon--chevron-down"
                        }`}
                      >
                        {showDetails ? "Hide" : "Show"} details
                      </i>
                      <span>
                        {updatesCount} update
                        {updatesCount > 1 ? "s" : ""}
                      </span>
                    </button>
                  </>
                )}
              </div>
              <div className="col-6 p-releases-confirm__actions">
                {updatesCount > 0 && (
                  <div
                    className={`p-releases-confirm__details-toggle ${
                      showDetails ? "is-open" : ""
                    }`}
                  ></div>
                )}
                <ReleasesConfirmActions
                  isCancelEnabled={isCancelEnabled}
                  cancelPendingReleases={this.onRevertClick.bind(this)}
                  isApplyEnabled={isApplyEnabled}
                  applyPendingReleases={this.onApplyClick.bind(this)}
                  isLoading={isLoading}
                />
              </div>
            </div>
            {showDetails && <ReleasesConfirmDetails updates={updates} />}
          </div>
        </div>
      </>
    );
  }
}

ReleasesConfirm.propTypes = {
  updates: PropTypes.object.isRequired,

  releaseRevisions: PropTypes.func.isRequired,
  cancelPendingReleases: PropTypes.func.isRequired,
  setProgressiveReleasePercentage: PropTypes.func.isRequired,
  triggerGAEvent: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  return {
    updates: {
      ...getSeparatePendingReleases(state),
      pendingCloses: state.pendingCloses,
    },
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    releaseRevisions: () => dispatch(releaseRevisions()),
    cancelPendingReleases: () => dispatch(cancelPendingReleases()),
    setProgressiveReleasePercentage: (percentage) =>
      dispatch(setProgressiveReleasePercentage(percentage)),
    triggerGAEvent: (...eventProps) => dispatch(triggerGAEvent(...eventProps)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ReleasesConfirm);
