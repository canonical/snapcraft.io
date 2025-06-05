import { Component, createRef } from "react";
import { connect } from "react-redux";

import debounce from "../../../../libs/debounce";

import ReleasesConfirmDetails from "./releasesConfirmDetails/";
import ReleasesConfirmActions from "./releasesConfirmActions";

import {
  cancelPendingReleases,
  setProgressiveReleasePercentage,
} from "../actions/pendingReleases";
import { releaseRevisions } from "../actions/releases";
import { triggerGAEvent } from "../actions/gaEventTracking";
import { getSeparatePendingReleases } from "../selectors";

type Props = {
  triggerGAEvent: Function;
  cancelPendingReleases: Function;
  setProgressiveReleasePercentage: Function;
  releaseRevisions: Function;
  updates: any;
};

type State = {
  isLoading: boolean;
  showDetails: boolean;
  percentage?: number;
};

class ReleasesConfirm extends Component<Props, State> {
  stickyBar: any;
  constructor(props: Props) {
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
      }, 500),
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

  onPercentageChange(event: { target: { value: any } }) {
    this.setState({
      percentage: event.target.value,
    });
  }

  toggleDetails() {
    this.props.triggerGAEvent(
      `click-${this.state.showDetails ? "hide" : "show"}-details`,
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
      <div
        className={`p-releases-confirm ${updatesCount > 0 ? "" : "u-hide"}`}
        ref={this.stickyBar}
        aria-live="polite"
      >
        <div className="u-fixed-width">
          <div className="p-releases-row u-align--right p-releases-confirm__buttons">
            {updatesCount > 0 && (
              <>
                {!showDetails && (
                  <button
                    className="p-button u-no-margin--bottom"
                    onClick={this.onRevertClick.bind(this)}
                  >
                    Revert
                  </button>
                )}
                <button
                  type="button"
                  className={`p-button--${showDetails ? "base" : "positive"} u-no-margin--bottom`}
                  onClick={this.toggleDetails.bind(this)}
                >
                  {showDetails ? "Hide changes" : "Review changes"}
                </button>
              </>
            )}
          </div>
          {showDetails && (
            <>
              <ReleasesConfirmDetails updates={updates} />
              <ReleasesConfirmActions
                isCancelEnabled={isCancelEnabled}
                cancelPendingReleases={this.onRevertClick.bind(this)}
                isApplyEnabled={isApplyEnabled}
                applyPendingReleases={this.onApplyClick.bind(this)}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: any) => {
  return {
    updates: {
      ...getSeparatePendingReleases(state),
      pendingCloses: state.pendingCloses,
    },
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    releaseRevisions: () => dispatch(releaseRevisions()),
    cancelPendingReleases: () => dispatch(cancelPendingReleases()),
    setProgressiveReleasePercentage: (percentage: number) =>
      dispatch(setProgressiveReleasePercentage(percentage)),
    triggerGAEvent: (...eventProps: any) =>
      dispatch(triggerGAEvent(...eventProps)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ReleasesConfirm);
