import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { setCurrentTrack } from "../actions/currentTrack";
import { closeHistory } from "../actions/history";
import { getTracks } from "../selectors";

import DefaultTrackModifier from "./defaultTrackModifier";

class ReleasesHeading extends Component {
  onTrackChange(event) {
    this.props.setCurrentTrack(event.target.value);
    this.props.closeHistoryPanel();
  }

  renderTrackDropdown(tracks) {
    const { currentTrack, defaultTrack } = this.props;
    return (
      <form className="p-form p-form--inline">
        <select
          id="track-dropdown"
          onChange={this.onTrackChange.bind(this)}
          value={currentTrack}
        >
          {tracks.map((track) => (
            <option key={`${track}`} value={track}>
              {track}{" "}
              {defaultTrack === track && track !== "latest" && "(default)"}
            </option>
          ))}
        </select>
      </form>
    );
  }

  render() {
    const { tracks } = this.props;

    const Wrap = tracks.length > 1 ? "label" : "span";
    return (
      <section className="p-strip is-shallow u-no-padding--bottom">
        <div className="row">
          <div className="col-6">
            <h4>
              <Wrap htmlFor="track-dropdown">
                {tracks.length > 1 ? (
                  <>
                    Track &nbsp;
                    {this.renderTrackDropdown(tracks)}
                  </>
                ) : (
                  <>Releases available to install</>
                )}
              </Wrap>
            </h4>
          </div>
          <div className="col-6" style={{ marginTop: "0.25rem" }}>
            {tracks.length > 1 && <DefaultTrackModifier />}
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
