import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { setCurrentTrack } from "../actions/currentTrack";
import { getTracks } from "../selectors";
import DefaultTrackModifier from "./defaultTrackModifier";

class ReleasesHeading extends Component {
  onTrackChange(event) {
    this.props.setCurrentTrack(event.target.value);
  }

  renderTrackDropdown(tracks) {
    const { currentTrack } = this.props;
    return (
      <form className="p-form p-form--inline">
        <select
          id="track-dropdown"
          onChange={this.onTrackChange.bind(this)}
          value={currentTrack}
        >
          {tracks.map(track => (
            <option key={`${track}`} value={track}>
              {track}
            </option>
          ))}
        </select>
      </form>
    );
  }

  render() {
    const { tracks, defaultTrack } = this.props;

    const Wrap = tracks.length > 1 ? "label" : "span";
    return (
      <div className="row">
        <div className="col-6">
          <h4>
            <Wrap htmlFor="track-dropdown">
              Releases available to install
              {tracks.length > 1 && (
                <Fragment>
                  {" "}
                  in &nbsp;
                  {this.renderTrackDropdown(tracks)}
                </Fragment>
              )}
            </Wrap>
          </h4>
        </div>
        <div className="col-6">
          {tracks.length > 1 && (
            <DefaultTrackModifier defaultTrack={defaultTrack} />
          )}
        </div>
      </div>
    );
  }
}

ReleasesHeading.propTypes = {
  tracks: PropTypes.array.isRequired,
  setCurrentTrack: PropTypes.func.isRequired,
  defaultTrack: PropTypes.string.isRequired,
  currentTrack: PropTypes.string.isRequired
};

const mapStateToProps = state => {
  return {
    tracks: getTracks(state),
    currentTrack: state.currentTrack
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setCurrentTrack: track => dispatch(setCurrentTrack(track))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReleasesHeading);
