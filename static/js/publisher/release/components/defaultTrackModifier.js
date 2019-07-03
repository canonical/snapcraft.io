import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { getTracks, getTrackRevisions } from "../selectors";
import { CLOSE_MODAL, openModal } from "../actions/modal";
import {
  showNotification,
  hideNotification
} from "../actions/globalNotification";

class DefaultTrackModifier extends Component {
  constructor(props) {
    super(props);

    this.setDefaultTrackHandler = this.setDefaultTrackHandler.bind(this);
    this.clearDefaultTrackHandler = this.clearDefaultTrackHandler.bind(this);
  }

  clearDefaultTrackHandler() {
    const { defaultTrack, openModal } = this.props;

    openModal({
      title: "Clear default track",
      content: `By clearing the default track, any snap that installed the snap with no track specified will switch to the latest track, and new installs without an explicit track selection will follow latest. Would you like to proceed?`,
      actions: [
        {
          appearance: "positive",
          onClickAction: {
            reduxAction: "clearDefaultTrack"
          },
          label: `Clear ${defaultTrack} as default track`
        },
        {
          appearance: "neutral",
          onClickAction: {
            type: CLOSE_MODAL
          },
          label: "Cancel"
        }
      ]
    });
  }

  setDefaultTrackHandler() {
    const { currentTrack, openModal } = this.props;

    openModal({
      title: `Set default track to ${currentTrack}`,
      content: `By setting a default track, any device that installed the snap with no track specified will switch to the newly defined default track, and new installs without an explicit track selection will follow ${currentTrack}. Would you like to proceed?`,
      actions: [
        {
          appearance: "positive",
          onClickAction: {
            reduxAction: "setDefaultTrack"
          },
          label: `Set ${currentTrack} as default track`
        },
        {
          appearance: "neutral",
          onClickAction: {
            type: CLOSE_MODAL
          },
          label: "Cancel"
        }
      ]
    });
  }

  renderSetButton() {
    const { defaultTrack, currentTrack } = this.props;
    return (
      <button
        className="p-button--neutral u-no-margin--bottom p-tooltip p-tooltip--btm-right"
        aria-describedby="set-default-tooltip"
        onClick={this.setDefaultTrackHandler}
      >
        Set as default track
        <span
          className="p-tooltip__message"
          role="tooltip"
          id="set-default-tooltip"
        >
          When setting {currentTrack} as default track, any device
          <br />
          currently tracking {defaultTrack} will switch to tracking
          <br />
          {currentTrack} on the next refresh, and new installs that
          <br />
          do not specify a track will follow {currentTrack}.
        </span>
      </button>
    );
  }

  renderClearLink() {
    return (
      <p>
        This is the default track for the snap.&nbsp;
        <a
          className="p-tooltip p-tooltip--btm-right"
          aria-describedby="clear-default-tooltip"
          onClick={this.clearDefaultTrackHandler}
        >
          Clear default track
          <span
            className="p-tooltip__message"
            role="tooltip"
            id="clear-default-tooltip"
          >
            By clearing the default track, new installations
            <br />
            with no explicit track specified will recieve
            <br />
            the updates from the latest track.
          </span>
        </a>
      </p>
    );
  }

  render() {
    const { defaultTrack, currentTrack } = this.props;
    const isCurrentDefault = defaultTrack === currentTrack;
    const defaultIsLatest = defaultTrack === "latest";

    if (currentTrack === "latest") {
      return null;
    }

    return (
      <div className="u-float--right">
        {!isCurrentDefault && this.renderSetButton()}
        {isCurrentDefault && !defaultIsLatest && this.renderClearLink()}
      </div>
    );
  }
}

DefaultTrackModifier.propTypes = {
  defaultTrack: PropTypes.string,
  currentTrack: PropTypes.string.isRequired,
  openModal: PropTypes.func.isRequired,
  showNotification: PropTypes.func.isRequired,
  latestTrackRevisions: PropTypes.array.isRequired,
  csrfToken: PropTypes.string.isRequired,
  snapName: PropTypes.string.isRequired
};

const mapStateToProps = state => ({
  currentTrack: state.currentTrack,
  tracks: getTracks(state),
  latestTrackRevisions: getTrackRevisions(state, "latest"),
  csrfToken: state.options.csrfToken,
  snapName: state.options.snapName,
  defaultTrack: state.defaultTrack
});

const mapDispatchToProps = dispatch => ({
  openModal: payload => dispatch(openModal(payload)),
  showNotification: payload => dispatch(showNotification(payload)),
  hideNotification: () => dispatch(hideNotification())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DefaultTrackModifier);
