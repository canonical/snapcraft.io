import React, { Component } from "react";
import PropTypes from "prop-types";

class ReleasesHeading extends Component {
  onTrackChange(event) {
    this.props.setCurrentTrack(event.target.value);
  }

  renderTrackDropdown(tracks) {
    return (
      <form className="p-form p-form--inline u-float--right">
        <div className="p-form__group">
          <label htmlFor="track-dropdown" className="p-form__label">
            Show revisions released in
          </label>
          <div className="p-form__control u-clearfix">
            <select
              id="track-dropdown"
              onChange={this.onTrackChange.bind(this)}
            >
              {tracks.map(track => (
                <option key={`${track}`} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>
    );
  }

  render() {
    const tracks = this.props.tracks;

    return (
      <div className="u-clearfix">
        <h4 className="u-float--left">Releases available to install</h4>
        {tracks.length > 1 && this.renderTrackDropdown(tracks)}
      </div>
    );
  }
}

ReleasesHeading.propTypes = {
  tracks: PropTypes.array.isRequired,
  setCurrentTrack: PropTypes.func.isRequired
};

export default ReleasesHeading;
