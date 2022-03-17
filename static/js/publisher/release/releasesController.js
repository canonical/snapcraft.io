import React, { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

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
  getReleaseDataFromChannelMap,
} from "./releasesState";

const ReleasesController = ({
  snapName,
  releasesData,
  channelMap,
  updateReleases,
  updateRevisions,
  initChannelMap,
  notification,
  showModal,
}) => {
  const [ready, setReady] = useState(false);
  const revisionsList = releasesData.revisions;

  useEffect(() => {
    getReleaseDataFromChannelMap(channelMap, revisionsList, snapName).then(
      ([transformedChannelMap, revisionsListAdditions]) => {
        Array.prototype.push.apply(revisionsList, revisionsListAdditions);
        const revisionsMap = getRevisionsMap(revisionsList);

        initReleasesData(revisionsMap, releasesData.releases);
        updateRevisions(revisionsMap);
        updateReleases(releasesData.releases);

        initChannelMap(transformedChannelMap);
        setReady(true);
      }
    );
  }, []);

  const { visible } = notification;

  return (
    <Fragment>
      {!ready && (
        <div className="p-strip">
          <div className="row">
            <div className="col-4 col-start-large-5">
              <div className="p-card u-align--center">
                <div>Loading... Please wait</div>
                <div>
                  <i className="p-icon--spinner u-animation--spin" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {ready && (
        <Fragment>
          {visible && (
            <div className="u-fixed-width">
              <Notification />
            </div>
          )}
          <ReleasesHeading />
          <ReleasesTable />
          {showModal && <Modal />}
          <ReleasesConfirm />
        </Fragment>
      )}
    </Fragment>
  );
};

ReleasesController.propTypes = {
  snapName: PropTypes.string.isRequired,
  releasesData: PropTypes.object.isRequired,
  channelMap: PropTypes.array.isRequired,

  notification: PropTypes.object,
  showModal: PropTypes.bool,

  initChannelMap: PropTypes.func,
  updateReleases: PropTypes.func,
  updateRevisions: PropTypes.func,
};

const mapStateToProps = (state) => {
  return {
    showModal: state.modal.visible,
    notification: state.notification,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    initChannelMap: (channelMap) => dispatch(initChannelMap(channelMap)),
    updateRevisions: (revisions) => dispatch(updateRevisions(revisions)),
    updateReleases: (releases) => dispatch(updateReleases(releases)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ReleasesController);
