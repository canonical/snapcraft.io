import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { setCurrentTrack } from "../actions/currentTrack";
import { closeHistory } from "../actions/history";
import { getTracks } from "../selectors";

import DefaultTrackModifier from "./defaultTrackModifier";
import TrackDropdown from "./trackDropdown";

class ReleasesHeading extends Component {
  render() {
    const { tracks, currentTrack, defaultTrack, setCurrentTrack } = this.props;
    const options = tracks.map((track) => ({ value: track, label: track }));

    const handleTrackChange = (track) => {
      setCurrentTrack(track);
    };

    return (
      <section className="p-strip is-shallow u-no-padding--bottom">
        <div className="row">
          <div className="col-6">
            <h4 className="p-strip is-shallow u-no-padding--top u-no-padding--bottom">
              Releases available to install
            </h4>
            <h5 className="p-strip is-shallow u-no-padding--top">
              <label htmlFor="track-dropdown">
                Track: &nbsp;
                <TrackDropdown
                  options={options}
                  label={currentTrack}
                  defaultTrack={defaultTrack}
                  currentTrack={currentTrack}
                  onChange={handleTrackChange}
                />
              </label>
            </h5>
          </div>
          <div className="col-6" style={{ marginTop: "0.25rem" }}>
            {<DefaultTrackModifier />}
          </div>
        </div>
      </section>
    );
  }
}

ReleasesHeading.propTypes = {
  tracks: PropTypes.array.isRequired,
  setCurrentTrack: PropTypes.func.isRequired,
  closeHistoryPanel: PropTypes.func.isRequired,
  currentTrack: PropTypes.string.isRequired,
  defaultTrack: PropTypes.string,
};

const mapStateToProps = (state) => {
  return {
    tracks: getTracks(state),
    currentTrack: state.currentTrack,
    defaultTrack: state.defaultTrack,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setCurrentTrack: (track) => dispatch(setCurrentTrack(track)),
    closeHistoryPanel: () => dispatch(closeHistory()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ReleasesHeading);
