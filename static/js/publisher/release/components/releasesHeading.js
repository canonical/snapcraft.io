import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import { setCurrentTrack } from "../actions/currentTrack";
import { getTracks } from "../selectors";

class ReleasesHeading extends Component {
  onTrackChange(event) {
    this.props.setCurrentTrack(event.target.value);
  }

  renderTrackDropdown(tracks) {
    return (
      <form className="p-form p-form--inline">
        <select id="track-dropdown" onChange={this.onTrackChange.bind(this)}>
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
    const tracks = this.props.tracks;
    const Wrap = tracks.length > 1 ? "label" : "span";
    return (
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
    );
  }
}

ReleasesHeading.propTypes = {
  tracks: PropTypes.array.isRequired,
  setCurrentTrack: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    tracks: getTracks(state)
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
