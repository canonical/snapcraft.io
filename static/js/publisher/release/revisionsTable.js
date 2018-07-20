import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

export default class RevisionsTable extends Component {
  constructor() {
    super();

    // default to latest track
    this.state = {
      currentTrack: 'latest'
    };
  }

  // getting list of tracks names from track/channel names list
  getTracksFromChannels(releasedChannels) {
    const channels = Object.keys(releasedChannels);
    const tracks = ['latest'];

    channels.forEach(channel => {
      const split = channel.split('/');

      // if there is a track name in the channel name
      // and we haven't saved it yet, s
      if (split.length > 1 && tracks.indexOf(split[0]) === -1) {
        tracks.push(split[0]);
      }
    });

    return tracks;
  }

  // getting 'channel map' kind of data out of revisions list
  // TODO: possibly it would be good to do it in backend (or even get from API)
  getReleaseDataFromList(revisions) {
    const releasedChannels = {};
    const releasedArchs = {};

    revisions.forEach(revision => {

      revision.channels.forEach(channel => {
        if (!releasedChannels[channel]) {
          releasedChannels[channel] = {};
        }

        // some revisions may have multiple architectures listed
        const archs = revision.arch.split(', ');

        archs.forEach(arch => {
          if (releasedChannels[channel][arch]) {
            if (revision.revision > releasedChannels[channel][arch]) {
              releasedChannels[channel][arch] = revision;
            }
          } else {
            releasedChannels[channel][arch] = revision;
          }
          releasedArchs[arch] = true;
        });
      });
    });

    // channels - key-value map of a channel and all revisions released in it
    //            for different architectures
    // archs - list of archs that have released revisions
    // tracks - list of tracks that have released revisions
    return {
      channels: releasedChannels,
      archs: Object.keys(releasedArchs).sort(),
      tracks: this.getTracksFromChannels(releasedChannels)
    };
  }

  renderRows(releaseData) {
    const { channels, archs } = releaseData;

    const track = this.state.currentTrack;

    return ['stable', 'candidate', 'beta', 'edge'].map((channel) => {
      if (track !== 'latest') {
        channel = `${track}/${channel}`;
      }

      const release = channels[channel] || {};

      // make sure to display 'latest' in front of default channels
      if (track === 'latest') {
        channel = `${track}/${channel}`;
      }

      return (
        <tr key={channel}>
          <td>{ channel }</td>
          {
            archs.map(arch => {
              return (
                <td
                  key={`${channel}/${arch}`}
                  title={ release[arch] ? release[arch].version : null }
                >
                  { release[arch] ? release[arch].version : '-' }
                </td>
              );
            })
          }
        </tr>
      );
    });
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
              {
                tracks.map(track => <option key={`${track}`} value={track}>{ track }</option>)
              }
            </select>
          </div>
        </div>
      </form>
    );
  }

  onTrackChange(event) {
    this.setState({ currentTrack: event.target.value });
  }

  render() {
    const releaseData = this.getReleaseDataFromList(this.props.revisions);


    return (
      <Fragment>
        <div className="u-clearfix">
          <h4 className="u-float--left">Releases available for install</h4>
          { releaseData.tracks.length > 1 && this.renderTrackDropdown(releaseData.tracks) }
        </div>
        <table className="p-release-table">
          <thead>
            <tr>
              <th width="22%" scope="col"></th>
              {
                releaseData.archs.map(arch => <th width="13%" key={`${arch}`}>{ arch }</th>)
              }
            </tr>
          </thead>

          <tbody>
            { this.renderRows(releaseData) }
          </tbody>
        </table>
      </Fragment>
    );
  }
}

RevisionsTable.propTypes = {
  revisions: PropTypes.object.isRequired
};
