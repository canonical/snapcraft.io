import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import "whatwg-fetch";

import ReleasesTable from "./components/releasesTable";
import Notification from "./components/globalNotification";
import ReleasesHeading from "./components/releasesHeading";
import ReleasesConfirm from "./components/releasesConfirm";
import Modal from "./components/modal";

import { updateRevisions } from "./actions/revisions";
import { updateReleases } from "./actions/releases";
import {
  initChannelMap,
  selectRevision,
  releaseRevisionSuccess,
  closeChannelSuccess
} from "./actions/channelMap";
import { undoRelease, cancelPendingReleases } from "./actions/pendingReleases";
import {
  showNotification,
  hideNotification
} from "./actions/globalNotification";

import { getPendingChannelMap } from "./selectors";

import {
  getRevisionsMap,
  initReleasesData,
  getReleaseDataFromChannelMap
} from "./releasesState";

const ERROR_MESSAGE =
  "There was an error while processing your request, please try again later.";

class ReleasesController extends Component {
  constructor(props) {
    super(props);

    // init channel data in revisions list
    // TODO: should be done in reducers?
    const revisionsMap = getRevisionsMap(this.props.releasesData.revisions);
    initReleasesData(revisionsMap, this.props.releasesData.releases);

    // init redux store
    // TODO: should be done outside component as initial state?
    this.props.updateRevisions(revisionsMap);
    this.props.updateReleases(this.props.releasesData.releases);
    this.props.initChannelMap(
      getReleaseDataFromChannelMap(this.props.channelMapsList, revisionsMap)
    );

    this.state = {
      isLoading: false
    };
  }

  updateReleasesData(releasesData) {
    // init channel data in revisions list
    const revisionsMap = getRevisionsMap(releasesData.revisions);
    initReleasesData(revisionsMap, releasesData.releases);

    this.props.updateRevisions(revisionsMap);
    this.props.updateReleases(releasesData.releases);
  }

  fetchReleasesHistory() {
    const { csrfToken } = this.props.options;

    return fetch(`/${this.props.snapName}/releases/json`, {
      method: "GET",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-CSRFToken": csrfToken
      },
      redirect: "follow",
      referrer: "no-referrer"
    })
      .then(response => response.json())
      .catch(() => {
        throw new Error(ERROR_MESSAGE);
      });
  }

  fetchRelease(revision, channels) {
    const { csrfToken } = this.props.options;

    return fetch(`/${this.props.snapName}/releases`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-CSRFToken": csrfToken
      },
      redirect: "follow",
      referrer: "no-referrer",
      body: JSON.stringify({ revision, channels, name: this.props.snapName })
    })
      .then(response => response.json())
      .catch(() => {
        throw new Error(ERROR_MESSAGE);
      });
  }

  fetchClose(channels) {
    const { csrfToken } = this.props.options;

    return fetch(`/${this.props.snapName}/releases/close-channel`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-CSRFToken": csrfToken
      },
      redirect: "follow",
      referrer: "no-referrer",
      body: JSON.stringify({ channels })
    })
      .then(response => response.json())
      .catch(() => {
        throw new Error(ERROR_MESSAGE);
      });
  }

  // TODO: move inside of this function out
  handleReleaseResponse(json, release) {
    if (json.success) {
      const { revisions } = this.props;

      // update channel map based on the response
      json.channel_map.forEach(map => {
        if (map.revision) {
          let revision;

          if (map.revision === +release.id) {
            // release.id is a string so turn it into a number for comparison
            revision = release.revision;
          } else if (revisions[map.revision]) {
            revision = revisions[map.revision];
          } else {
            revision = {
              revision: map.revision,
              version: map.version,
              architectures: release.revision.architectures
            };
          }

          let channel = map.channel;
          if (channel.indexOf("/") === -1) {
            channel = `latest/${channel}`;
          }

          this.props.releaseRevisionSuccess(revision, channel);
        }
      });
    } else {
      let error = new Error(
        `Error while releasing ${release.revision.version} (${
          release.revision.revision
        }) to ${release.channels.join(", ")}.`
      );
      error.json = json;
      throw error;
    }
  }

  handleReleaseError(error) {
    const { showNotification } = this.props;
    let message = error.message || ERROR_MESSAGE;

    // try to find error messages in response json
    // which may be an array or errors or object with errors property
    if (error.json) {
      const errors = error.json.length ? error.json : error.json.errors;

      if (errors.length) {
        message =
          message +
          " " +
          errors
            .map(e => e.message)
            .filter(m => m)
            .join(" ");
      }
    }

    showNotification({
      status: "error",
      appearance: "negative",
      content: message
    });
  }

  handleCloseResponse(json, channels) {
    if (json.success) {
      if (json.closed_channels && json.closed_channels.length > 0) {
        json.closed_channels.forEach(channel => {
          // make sure channels without track name get prefixed with 'latest'
          if (channel.indexOf("/") === -1) {
            channel = `latest/${channel}`;
          }

          this.props.closeChannelSuccess(channel);
        });
      }
    } else {
      let error = new Error(
        `Error while closing channels: ${channels.join(", ")}.`
      );
      error.json = json;
      throw error;
    }
  }

  fetchReleases(releases) {
    var queue = Promise.resolve(); // Q() in q

    // handle releases as a queue
    releases.forEach(release => {
      return (queue = queue.then(() => {
        return this.fetchRelease(release.id, release.channels).then(json =>
          this.handleReleaseResponse(json, release)
        );
      }));
    });
    return queue;
  }

  fetchCloses(channels) {
    if (channels.length) {
      return this.fetchClose(channels).then(json =>
        this.handleCloseResponse(json, channels)
      );
    } else {
      return Promise.resolve();
    }
  }

  fetchUpdatedReleasesHistory() {
    return this.fetchReleasesHistory().then(json =>
      this.updateReleasesData(json)
    );
  }

  releaseRevisions() {
    const { pendingReleases, pendingCloses, hideNotification } = this.props;
    const releases = Object.keys(pendingReleases).map(id => {
      return {
        id,
        revision: pendingReleases[id].revision,
        channels: pendingReleases[id].channels
      };
    });

    this.setState({ isLoading: true });
    hideNotification();
    this.fetchReleases(releases)
      .then(() => this.fetchCloses(pendingCloses))
      .then(() => this.fetchUpdatedReleasesHistory())
      .catch(error => this.handleReleaseError(error))
      .then(() => this.setState({ isLoading: false }))
      .then(() => this.props.cancelPendingReleases());
  }

  render() {
    const { notification } = this.props;
    const { visible } = notification;
    return (
      <Fragment>
        <div className="row">
          {visible && <Notification />}
          <ReleasesHeading />
          <ReleasesConfirm
            isLoading={this.state.isLoading}
            // triggers posting data to API
            releaseRevisions={this.releaseRevisions.bind(this)}
          />
        </div>
        <ReleasesTable />
        {this.props.showModal && <Modal />}
      </Fragment>
    );
  }
}

ReleasesController.propTypes = {
  snapName: PropTypes.string.isRequired,
  channelMapsList: PropTypes.array.isRequired,
  releasesData: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired,

  revisions: PropTypes.object,
  isHistoryOpen: PropTypes.bool,
  revisionsFilters: PropTypes.object,
  releasedChannels: PropTypes.object,
  pendingCloses: PropTypes.array,
  pendingReleases: PropTypes.object,
  pendingChannelMap: PropTypes.object,
  notification: PropTypes.object,
  showModal: PropTypes.bool,

  closeChannelSuccess: PropTypes.func,
  releaseRevisionSuccess: PropTypes.func,
  selectRevision: PropTypes.func,
  initChannelMap: PropTypes.func,
  updateReleases: PropTypes.func,
  updateRevisions: PropTypes.func,
  undoRelease: PropTypes.func,
  cancelPendingReleases: PropTypes.func,
  showNotification: PropTypes.func,
  hideNotification: PropTypes.func
};

const mapStateToProps = state => {
  return {
    isHistoryOpen: state.history.isOpen,
    revisionsFilters: state.history.filters,
    revisions: state.revisions,
    releasedChannels: state.channelMap,
    pendingCloses: state.pendingCloses,
    pendingReleases: state.pendingReleases,
    pendingChannelMap: getPendingChannelMap(state),
    showModal: state.modal.visible,
    notification: state.notification
  };
};

const mapDispatchToProps = dispatch => {
  return {
    closeChannelSuccess: channel => dispatch(closeChannelSuccess(channel)),
    releaseRevisionSuccess: (revision, channel) =>
      dispatch(releaseRevisionSuccess(revision, channel)),
    selectRevision: revision => dispatch(selectRevision(revision)),
    initChannelMap: channelMap => dispatch(initChannelMap(channelMap)),
    updateRevisions: revisions => dispatch(updateRevisions(revisions)),
    updateReleases: releases => dispatch(updateReleases(releases)),
    undoRelease: (revision, channel) =>
      dispatch(undoRelease(revision, channel)),
    cancelPendingReleases: () => dispatch(cancelPendingReleases()),
    showNotification: payload => dispatch(showNotification(payload)),
    hideNotification: () => dispatch(hideNotification())
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesController);
