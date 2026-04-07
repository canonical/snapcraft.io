import { Component, createRef, RefObject } from "react";
import { connect } from "react-redux";

import debounce from "../../../../libs/debounce";

import ReleasesConfirmDetails from "./releasesConfirmDetails/";
import ReleasesConfirmActions from "./releasesConfirmActions";

import {
  cancelPendingChanges,
  setProgressiveRelease,
} from "../slices/pendingChanges";
import { releaseRevisions } from "../slices/releases";
import { getSeparatePendingReleases, type SeparatePendingReleases } from "../selectors";
import type { Progressive, ReleasesReduxState } from "../../../types/releaseTypes";
import { triggerGAEvent, type AppDispatch } from "../store";

interface OwnProps {
  // No own props - all props come from Redux
}

interface StateProps {
  updates: SeparatePendingReleases & {
    pendingCloses: ReleasesReduxState["pendingChanges"]["pendingCloses"];
  };
}

interface DispatchProps {
  triggerGAEvent: (...eventProps: Parameters<typeof triggerGAEvent>) => void;
  cancelPendingReleases: () => void;
  setProgressiveRelease: (percentage: Progressive) => void;
  releaseRevisions: () => Promise<unknown>;
}

type ReleasesConfirmProps = OwnProps & StateProps & DispatchProps;

type ReleasesConfirmState = {
  isLoading: boolean;
  showDetails: boolean;
  percentage?: number;
};

class ReleasesConfirm extends Component<ReleasesConfirmProps, ReleasesConfirmState> {
  stickyBar: RefObject<HTMLDivElement | null>;
  
  constructor(props: ReleasesConfirmProps) {
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
        if (this.stickyBar.current) {
          const stickyBarRec = this.stickyBar.current.getBoundingClientRect();
          const top = stickyBarRec.top;
          const scrollX = window.scrollX;
          const topPosition = top + scrollX;

          this.stickyBar.current.classList.toggle("is-pinned", topPosition === 0);
        }
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
      this.props.setProgressiveRelease({
        percentage: +this.state.percentage,
        "current-percentage": null,
      });
    }

    this.props.releaseRevisions().then(() => {
      this.setState({
        isLoading: false,
        showDetails: false,
      });
    });
  }

  onPercentageChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      percentage: +event.target.value,
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

    const updatesCount = (
      Object.keys(updates) as (keyof ReleasesConfirmProps["updates"])[]
    ).reduce((acc, update) => {
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
      </>
    );
  }
}

const mapStateToProps = (state: ReleasesReduxState): StateProps => {
  return {
    updates: {
      ...getSeparatePendingReleases(state),
      pendingCloses: state.pendingChanges.pendingCloses,
    },
  };
};

const mapDispatchToProps = (dispatch: AppDispatch): DispatchProps => {
  return {
    releaseRevisions: () => dispatch(releaseRevisions()),
    cancelPendingReleases: () => dispatch(cancelPendingChanges()),
    setProgressiveRelease: (percentage: Progressive) =>
      dispatch(setProgressiveRelease(percentage)),
    triggerGAEvent: (...eventProps: Parameters<typeof triggerGAEvent>) =>
      dispatch(triggerGAEvent(...eventProps)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ReleasesConfirm);
