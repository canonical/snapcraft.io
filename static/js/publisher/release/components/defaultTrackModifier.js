import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { getTracks, getTrackRevisions } from "../selectors";
import { openModal, closeModal } from "../actions/modal";
import { showNotification, hideNotification } from "../actions/notification";

class DefaultTrackModifier extends Component {
  constructor(props) {
    super(props);

    this.setDefaultTrackHandler = this.setDefaultTrackHandler.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.confirmDefaultTrackHandler = this.confirmDefaultTrackHandler.bind(this);
    this.clearDefaultTrackHandler = this.clearDefaultTrackHandler.bind(this);
  }

  handleCloseModal() {
    const { closeModal } = this.props;

    closeModal();
  }

  confirmDefaultTrackHandler() {
    const { currentTrack, setDefaultTrack, closeModal, showNotification } = this.props;
    
    setDefaultTrack(currentTrack).then(() => {
      closeModal();
      showNotification({
        status: "success",
        appearance: "positive",
        // TODO: Get the name of the snap here
        content: `The default track has been set to ${currentTrack}. All new installations without a specified track will receive updates from the newly defined default track ${currentTrack}.`,
        canDismiss: true
      });
    });
  }

  clearDefaultTrackHandler() {
    const { setDefaultTrack, showNotification } = this.props;
    setDefaultTrack(null).then(() => {
      showNotification({
        status: "success",
        appearance: "positive",
        content: `The default track has been removed. All new installations with a specified track will receive updates from latest.`,
        canDismiss: true
      });
    });
  }

  setDefaultTrackHandler() {
    const {
      defaultTrack,
      currentTrack,
      latestTrackRevisions,
      openModal
    } = this.props;

    if (defaultTrack === "latest" && latestTrackRevisions.length > 0) {
      openModal({
        title: "You still have releases available in the latest track",
        content: "To specify a default track on your snap, you must have no releases in the latest channel. You can do this, by closing all risk levels within the latest track.",
        actions: [
          (
            <button
              key="contine"
              className="p-button--positive u-no-margin--bottom u-float--right"
              onClick={this.handleCloseModal}
            >
              Continue
            </button>
          )
        ],
        closeModal: this.handleCloseModal
      });
      return;
    } else {
      openModal({
        title: `Set default track to ${currentTrack}`,
        content: "By setting a default track, any device that installed the snap with no track specified will get updates from the newly defined default track. Would you like to proceed?",
        actions: [
          (
            <button
              key="continue"
              className="p-button--positive u-no-margin--bottom u-float--right"
              onClick={this.confirmDefaultTrackHandler}
            >
              Set {currentTrack} as default track
            </button>
          ),
          (
            <button
              key="cancel"
              className="p-button--neutral u-no-margin--bottom u-float--right"
              onClick={this.handleCloseModal}
            >
              Cancel
            </button>
          )
        ],
        closeModal: this.handleCloseModal
      });
    }
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
          Any device pointing to a risk level from the latest
          <br />
          track, will point to updates coming from the
          <br />
          same risk level in the track {currentTrack}.
          <br />
          i.e. {defaultTrack}/stable &rarr; {currentTrack}/stable
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
          <span className="p-tooltip__message" role="tooltip" id="clear-default-tooltip">
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

    return (
      <div className="u-float--right">
        {!isCurrentDefault && this.renderSetButton()}
        {isCurrentDefault && !defaultIsLatest && this.renderClearLink()}
      </div>
    );
  }
}

DefaultTrackModifier.propTypes = {
  defaultTrack: PropTypes.string.isRequired,
  currentTrack: PropTypes.string.isRequired,
  setDefaultTrack: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  currentTrack: state.currentTrack,
  tracks: getTracks(state),
  latestTrackRevisions: getTrackRevisions(state.channelMap, "latest")
});

const mapDispatchToProps = (dispatch) => ({
  openModal: (payload) => dispatch(openModal(payload)),
  closeModal: () => dispatch(closeModal()),
  showNotification: (payload) => dispatch(showNotification(payload)),
  hideNotification: () => dispatch(hideNotification())
});

export default connect(mapStateToProps, mapDispatchToProps)(DefaultTrackModifier);
