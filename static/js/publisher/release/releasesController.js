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
import { initChannelMap } from "./actions/channelMap";

import {
  getRevisionsMap,
  initReleasesData,
  getReleaseDataFromChannelMap
} from "./releasesState";

class ReleasesController extends Component {
  constructor(props) {
    super(props);

    const { releasesData, channelMapsList } = this.props;

    // init channel data in revisions list
    // TODO: should be done in reducers?
    const revisionsMap = getRevisionsMap(releasesData.revisions);
    initReleasesData(revisionsMap, releasesData.releases);

    // init redux store
    // TODO: should be done outside component as initial state?
    this.props.updateRevisions(revisionsMap);
    this.props.updateReleases(releasesData.releases);
    this.props.initChannelMap(
      getReleaseDataFromChannelMap(channelMapsList, revisionsMap)
    );
  }

  render() {
    const { notification, showModal } = this.props;
    const { visible } = notification;
    return (
      <Fragment>
        <div className="row">
          <ReleasesConfirm />
          {visible && <Notification />}
          <ReleasesHeading />
        </div>
        <ReleasesTable />
        {showModal && <Modal />}
      </Fragment>
    );
  }
}

ReleasesController.propTypes = {
  channelMapsList: PropTypes.array.isRequired,
  releasesData: PropTypes.object.isRequired,

  notification: PropTypes.object,
  showModal: PropTypes.bool,

  initChannelMap: PropTypes.func,
  updateReleases: PropTypes.func,
  updateRevisions: PropTypes.func
};

const mapStateToProps = state => {
  return {
    showModal: state.modal.visible,
    notification: state.notification
  };
};

const mapDispatchToProps = dispatch => {
  return {
    initChannelMap: channelMap => dispatch(initChannelMap(channelMap)),
    updateRevisions: revisions => dispatch(updateRevisions(revisions)),
    updateReleases: releases => dispatch(updateReleases(releases))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesController);
