import React, { Component } from 'react';
import PropTypes from 'prop-types';
import 'whatwg-fetch';

import RevisionsTable from './revisionsTable';

// TODO: not needed here?
// const RISKS = ['stable', 'candidate', 'beta', 'edge'];

export default class Releases extends Component {
  constructor(props) {
    super(props);

    // TODO: update state on fetch, pass it to RevisionsTable
    this.state = {
      error: null,
      isLoading: false,
      releasedChannels: this.props.releasedChannels
    };
  }

  fetchRelease(revision, channels) {
    const { csrfToken } = this.props.options;

    console.log('fetch', revision, channels );
    return fetch(`/account/snaps/${this.props.snapName}/release`, {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "X-CSRFToken": csrfToken
      },
      redirect: "follow",
      referrer: "no-referrer",
      body: JSON.stringify({ revision, channels, name: this.props.snapName }),
    })
      .then(response => response.json());
  }

  handleReleaseResponse(json, release) {
    console.log("response", json);

    // TODO: update state/channel map after each successful release
    if (json.success) {
      console.log("update channel map", json.channel_map);

      this.setState(state => {
        const releasedChannels = state.releasedChannels;

        // update releasedChannels based on channel map from the response
        json.channel_map.forEach(map => {
          console.log('map', map)
          // TODO:
          // - close channels when there is no release?
          // - ignore revisions other then the one just released?
          // - get revision data from revisionsMap?
          if (map.revision) {

            let revision;
            if (map.revision === release.id) {
              revision = release.revision;
            } else {
              revision = {
                revision: map.revision,
                version: map.version,
                architectures: release.revision.architectures
              };
            }

            let channel = map.channel;
            if (channel.indexOf('/') === -1) {
              channel = `latest/${channel}`;
            }

            if (!releasedChannels[channel]) {
              releasedChannels[channel] = {};
            }


            revision.architectures.forEach(arch => {
              releasedChannels[channel][arch] = revision;
            });

          }
        });

        return {
          releasedChannels
        };
      });
    } else {
      console.log("error")
    }
  }

  fetchReleases(releases) {
    var queue = Promise.resolve(); // Q() in q

    // handle releases as a queue
    releases.forEach(release => {
      return queue = queue
        .then(() => {
          return this
            .fetchRelease(release.id, release.channels)
            .then(json => this.handleReleaseResponse(json, release));
        });
    });
    return queue;
  }

  releaseRevisions(revisionsToRelease) {
    console.log("revisions to release", revisionsToRelease);

    const releases = Object.keys(revisionsToRelease).map(id => {
      return { id, revision: revisionsToRelease[id].revision, channels: revisionsToRelease[id].channels };
    });

    console.log('fetchReleases', releases);
    this.setState({ isLoading: true });
    this.fetchReleases(releases)
      .then(() => console.log('all done'))
      // TODO: reset pending releases
      .then(() => this.setState({ isLoading: false }));
  }

  render() {
    const { archs, tracks, options } = this.props;
    const { releasedChannels } = this.state;

    return (
      <RevisionsTable
        releasedChannels={releasedChannels}
        tracks={tracks}
        archs={archs}
        options={options}
        releaseRevisions={this.releaseRevisions.bind(this)}
        fetchStatus={this.state}
      />
    );
  }
}

Releases.propTypes = {
  snapName: PropTypes.string.isRequired,
  releasedChannels: PropTypes.object.isRequired,
  archs: PropTypes.array.isRequired,
  tracks: PropTypes.array.isRequired,
  options: PropTypes.object.isRequired
};
