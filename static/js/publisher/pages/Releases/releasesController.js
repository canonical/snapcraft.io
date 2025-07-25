import React, { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import Notification from "./components/globalNotification";
import ReleasesHeading from "./components/releasesHeading";
import ReleasesConfirm from "./components/releasesConfirm";
import Modal from "./components/modal";

import { updateArchitectures } from "./actions/architectures";
import { updateRevisions } from "./actions/revisions";
import { updateReleases } from "./actions/releases";
import { initChannelMap } from "./actions/channelMap";

import {
  getRevisionsMap,
  initReleasesData,
  getReleaseDataFromChannelMap,
} from "./releasesState";
import { updateFailedRevisions } from "./actions/failedRevisions";

const ReleasesController = ({
  snapName,
  releasesData,
  channelMap,
  updateArchitectures,
  updateReleases,
  updateRevisions,
  updateFailedRevisions,
  initChannelMap,
  notification,
  showModal,
}) => {
  const [ready, setReady] = useState(false);
  const revisionsList = releasesData.revisions;

  useEffect(() => {
    getReleaseDataFromChannelMap(channelMap, revisionsList, snapName).then(
      ([transformedChannelMap, revisionsListAdditions, failedRevisions]) => {
        revisionsList.push(...revisionsListAdditions);
        const revisionsMap = getRevisionsMap(revisionsList);

        initReleasesData(revisionsMap, releasesData.releases, channelMap);
        updateRevisions(revisionsMap);
        updateReleases(releasesData.releases);
        updateArchitectures(revisionsList);
        initChannelMap(transformedChannelMap);
        updateFailedRevisions(failedRevisions);
        setReady(true);
      },
    );
  }, []);

  const { visible } = notification;
  return (
    <Fragment>
      {ready && <ReleasesConfirm />}
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
            <div className="u-fixed-width" style={{ marginTop: "1rem" }}>
              <Notification />
            </div>
          )}
          <div className="u-fixed-width u-hide--large u-hide--medium">
            <div className="p-notification--caution">
              <div className="p-notification__content">
                <h5 className="p-notification__title">
                  This is a read-only view
                </h5>
                <p className="p-notification__message">
                  Some features are not available on this view. Switch to a
                  tablet or desktop to edit.
                </p>
              </div>
            </div>
          </div>
          <ReleasesHeading snapName={snapName} />
          {showModal && <Modal />}
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
  updateArchitectures: PropTypes.func,
  updateReleases: PropTypes.func,
  updateRevisions: PropTypes.func,
  updateFailedRevisions: PropTypes.func,
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
    updateArchitectures: (revisions) =>
      dispatch(updateArchitectures(revisions)),
    updateRevisions: (revisions) => dispatch(updateRevisions(revisions)),
    updateFailedRevisions: (failedRevisions) => dispatch(updateFailedRevisions(failedRevisions)),
    updateReleases: (releases) => dispatch(updateReleases(releases)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ReleasesController);
