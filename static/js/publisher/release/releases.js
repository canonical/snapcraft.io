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
    };
  }

  fetchRelease(revision, channels) {
    const { csrfToken } = this.props.options;

    console.log('fetch', revision, channels );
    return fetch(`/account/snaps/${this.props.snapName}/release/snap-release`, {
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
      body: JSON.stringify({ revision, channels }),
    })
      .then(response => response.json());
  }

  handleReleaseResponse(json) {
    console.log("response", json);

    // TODO: update state/channel map after each successful release
    if (json.success) {
      console.log("update channel map", json.channel_map);
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
            .fetchRelease(release.revision, release.channels)
            .then(this.handleReleaseResponse.bind(this));
        });
      //.then(json => this.handleReleaseResponse(json));
    });
    return queue;
  }

  releaseRevisions(revisionsToRelease) {
    console.log("revisions to release", revisionsToRelease);

    const releases = Object.keys(revisionsToRelease).map(id => {
      return { revision: id, channels: revisionsToRelease[id].channels };
    });

    console.log('fetchReleases', releases);
    this.setState({ isLoading: true });
    this.fetchReleases(releases)
      .then(() => console.log('all done'))
      .then(() => this.setState({ isLoading: false }));
  }

  render() {
    const { releasedChannels, archs, tracks, options } = this.props;

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
