import React, { Fragment, useEffect } from "react";
import { connect } from "react-redux";

import Notification from "./components/globalNotification";
import ReleasesHeading from "./components/releasesHeading";
import ReleasesConfirm from "./components/releasesConfirm";
import Modal from "./components/modal";

import {
  initDefaultTrack,
  setCurrentTrack,
  updateReleasesData,
  initOptions
} from "./actions";

import type {
  ReleasesAPIResponse,
  ReleasesReduxState,
} from "../../types/releaseTypes";
import type { DispatchFn } from "./store";

// Props coming from parent component
interface OwnProps {
  snapName: string;
  apiData: ReleasesAPIResponse;
}

// Props from mapStateToProps
interface StateProps {
  showModal: ReleasesReduxState["modal"]["visible"];
  notification: ReleasesReduxState["notification"];
  ready: ReleasesReduxState["options"]["releasesReady"];
}

// Props from mapDispatchToProps
interface DispatchProps {
  updateReleasesData: (apiData: ReleasesAPIResponse) => Promise<void>;
  setCurrentTrack: (track: ReleasesReduxState["currentTrack"]) => void;
  initDefaultTrack: (track: ReleasesReduxState["defaultTrack"]) => void;
  initOptions: (options: ReleasesReduxState["options"]) => void;
}

// Combined props for the component
type ReleasesControllerProps = OwnProps & StateProps & DispatchProps;

const ReleasesController: React.FC<ReleasesControllerProps> = ({
  snapName,
  apiData,
  updateReleasesData,
  setCurrentTrack,
  initDefaultTrack,
  initOptions,
  notification,
  showModal,
  ready,
}) => {
  useEffect(() => {
    setCurrentTrack(apiData.data.default_track || "latest"),
    initDefaultTrack(apiData.data.default_track),
    initOptions({
      releasesReady: false,
      snapName: apiData.data.snap_name,
      flags: {
        isProgressiveReleaseEnabled: true,
      },
      tracks: apiData.data.tracks
    });
    updateReleasesData(apiData);
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

const mapStateToProps = (state: ReleasesReduxState): StateProps => {
  return {
    showModal: state.modal.visible,
    notification: state.notification,
    ready: state.options.releasesReady,
  };
};

const mapDispatchToProps = (dispatch: DispatchFn): DispatchProps => {
  return {
    updateReleasesData: (apiData) => dispatch(updateReleasesData(apiData)),
    setCurrentTrack: (track) => dispatch(setCurrentTrack(track)),
    initDefaultTrack: (track) => dispatch(initDefaultTrack(track)),
    initOptions: (options) => dispatch(initOptions(options))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ReleasesController);
