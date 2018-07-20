import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class RevisionsTable extends Component {

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
    const { channels, tracks, archs } = releaseData;

    let rows = [];

    tracks.forEach(track => {
      rows = rows.concat(['stable', 'candidate', 'beta', 'edge'].map((channel) => {
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
      }));
    });

    return rows;
  }

  render() {
    const releaseData = this.getReleaseDataFromList(this.props.revisions);

    return (
      <table className="p-release-table">
        <thead>
          <tr>
            <th width="40%" scope="col"></th>
            {
              releaseData.archs.map(arch => <th width="10%" key={`${arch}`}>{ arch }</th>)
            }
          </tr>
        </thead>

        <tbody>
          { this.renderRows(releaseData) }
        </tbody>
      </table>
    );
  }
}

RevisionsTable.propTypes = {
  revisions: PropTypes.object.isRequired
};
