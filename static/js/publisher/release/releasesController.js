import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import 'whatwg-fetch';

import RevisionsTable from './revisionsTable';
import RevisionsList from './revisionsList';
import Notification from './notification';

export default class ReleasesController extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // default to latest track
      currentTrack: this.props.options.defaultTrack || 'latest',
      error: null,
      isLoading: false,
      // released channels contains channel map for each channel in current track
      // also includes 'unassigned' fake channel to show selected unassigned revision
      releasedChannels: this.props.releasedChannels,
      // list of architectures released to (or selected to be released to)
      archs: this.getArchsFromReleasedChannels(this.props.releasedChannels),
      // revisions to be released:
      // key is the id of revision to release
      // value is object containing release object and channels to release to
      // {
      //  <revisionId>: {
      //    revision: { revision: <revisionId>, version, ... },
      //    channels: [ ... ]
      //  }
      // }
      pendingReleases: {},
      pendingCloses: [],
      // list of selected revisions, to know which ones to render selected
      selectedRevisions: []
    };
  }

  // update list of architectures based on revisions released (or selected)
  getArchsFromReleasedChannels(releasedChannels) {
    let archs = [];
    Object.keys(releasedChannels).forEach(channel => {
      Object.keys(releasedChannels[channel]).forEach(arch => {
        archs.push(arch);
      });
    });

    // make archs unique and sorted
    archs = archs.filter((item, i, ar) => ar.indexOf(item) === i);

    return archs.sort();
  }

  selectRevision(revision) {
    this.setState((state) => {
      const releasedChannels = state.releasedChannels;
      // TODO: export as a constant?
      const UNASSIGNED = 'unassigned';

      // TODO: support multiple archs
      const arch = revision.architectures[0];

      if (!releasedChannels[UNASSIGNED]) {
        releasedChannels[UNASSIGNED] = {};
      }

      if (releasedChannels[UNASSIGNED][arch] && (releasedChannels[UNASSIGNED][arch].revision === revision.revision)) {
        delete releasedChannels[UNASSIGNED][arch];
      } else {
        releasedChannels[UNASSIGNED][arch] = revision;
      }

      const selectedRevisions = Object.keys(releasedChannels[UNASSIGNED]).map(arch => releasedChannels[UNASSIGNED][arch].revision);
      const archs = this.getArchsFromReleasedChannels(releasedChannels);

      return {
        selectedRevisions,
        releasedChannels,
        archs
      };
    });
  }

  setCurrentTrack(track) {
    this.setState({ currentTrack: track });
  }

  // get channel map data updated with any pending releases
  getNextReleasedChannels() {
    const nextReleaseData = JSON.parse(JSON.stringify(this.state.releasedChannels));
    const { pendingReleases } = this.state;

    // for each release
    Object.keys(pendingReleases).forEach(releasedRevision => {
      pendingReleases[releasedRevision].channels.forEach(channel => {
        const revision = pendingReleases[releasedRevision].revision;

        if (!nextReleaseData[channel]) {
          nextReleaseData[channel] = {};
        }

        revision.architectures.forEach(arch => {
          nextReleaseData[channel][arch] = revision;
        });
      });
    });

    return nextReleaseData;
  }

  promoteChannel(channel, targetChannel) {
    const releasedChannels = this.getNextReleasedChannels();
    const archRevisions = releasedChannels[channel];

    if (archRevisions) {
      Object.keys(archRevisions).forEach((arch) => {
        this.promoteRevision(archRevisions[arch], targetChannel);
      });
    }
  }

  closeChannel(channel) {
    this.setState((state) => {
      let { pendingCloses, pendingReleases } = state;

      pendingCloses.push(channel);
      // make sure channels are unique
      pendingCloses = pendingCloses.filter((item, i, ar) => ar.indexOf(item) === i);

      // undo any pending releases to closed channel
      Object.keys(pendingReleases).forEach(revision => {
        const channels = pendingReleases[revision].channels;

        if (channels.includes(channel)) {
          channels.splice(channels.indexOf(channel), 1);
        }

        if (channels.length === 0) {
          delete pendingReleases[revision];
        }
      });

      return {
        pendingCloses,
        pendingReleases
      };
    });
  }

  // TODO:
  // - ignore if revision is already in given channel
  promoteRevision(revision, channel) {
    this.setState((state) => {
      const { pendingReleases } = state;

      // cancel any other pending release for the same channel in same architectures
      revision.architectures.forEach((arch) => {
        Object.keys(pendingReleases).forEach((revisionId) => {
          const pendingRelease = pendingReleases[revisionId];

          if (
            pendingRelease.channels.includes(channel) &&
            pendingRelease.revision.architectures.includes(arch)
          ) {
            this.undoRelease(pendingRelease.revision, channel);
          }
        });
      });

      if (!pendingReleases[revision.revision]) {
        pendingReleases[revision.revision] = {
          revision: revision,
          channels: []
        };
      }

      let channels = pendingReleases[revision.revision].channels;
      channels.push(channel);

      // make sure channels are unique
      channels = channels.filter((item, i, ar) => ar.indexOf(item) === i);

      pendingReleases[revision.revision].channels = channels;

      return {
        error: null,
        pendingReleases
      };
    });
  }

  undoRelease(revision, channel) {
    this.setState((state) => {
      const { pendingReleases } = state;

      if (pendingReleases[revision.revision]) {
        const channels = pendingReleases[revision.revision].channels;

        if (channels.includes(channel)) {
          channels.splice(channels.indexOf(channel), 1);
        }

        if (channels.length === 0) {
          delete pendingReleases[revision.revision];
        }
      }

      return {
        pendingReleases
      };
    });
  }

  clearPendingReleases() {
    this.setState({
      pendingReleases: {},
      pendingCloses: []
    });
  }

  fetchRelease(revision, channels) {
    const { csrfToken } = this.props.options;

    return fetch(`/${this.props.snapName}/release`, {
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

  fetchClose(channels) {
    const { csrfToken } = this.props.options;

    return fetch(`/${this.props.snapName}/release/close-channel`, {
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
      body: JSON.stringify({ channels }),
    })
      .then(response => response.json());
  }

  handleReleaseResponse(json, release) {
    if (json.success) {
      this.setState(state => {
        const releasedChannels = state.releasedChannels;

        // update releasedChannels based on channel map from the response
        json.channel_map.forEach(map => {
          // TODO:
          // possible improvements but not needed for functionality:
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

        const archs = this.getArchsFromReleasedChannels(releasedChannels);

        return {
          releasedChannels,
          archs
        };
      });
    } else {
      let error = new Error(`Error while releasing ${release.revision.version} (${release.revision.revision}) to ${release.channels.join(', ')}.`);
      error.json = json;
      throw error;
    }
  }

  handleReleaseError(error) {
    let message = error.message || "Error while performing the release. Please try again later.";

    // try to find error messages in response json
    // which may be an array or errors or object with errors property
    if (error.json) {
      const errors = error.json.length ? error.json : error.json.errors;

      if (errors.length) {
        message = message + " " + errors.map(e => e.message).filter(m => m).join(' ');
      }
    }

    this.setState({
      error: message
    });
  }

  handleCloseResponse(json, channels) {
    if (json.success) {
      this.setState((state) => {
        const { releasedChannels } = state;

        if(json.closed_channels && json.closed_channels.length > 0) {
          json.closed_channels.forEach(channel => {

            // make sure default channels get prefixed with 'latest'
            if (channel.indexOf('/') === -1) {
              channel = `latest/${channel}`;
            }

            delete releasedChannels[channel];
          });
        }

        return {
          releasedChannels
        };
      });
    } else {
      let error = new Error(`Error while closing channels: ${channels.join(', ')}.`);
      error.json = json;
      throw error;
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

  fetchCloses(channels) {
    if (channels.length) {
      return this.fetchClose(channels)
        .then(json => this.handleCloseResponse(json, channels));
    } else {
      return Promise.resolve();
    }
  }

  releaseRevisions() {
    const { pendingReleases, pendingCloses } = this.state;
    const releases = Object.keys(pendingReleases).map(id => {
      return { id, revision: pendingReleases[id].revision, channels: pendingReleases[id].channels };
    });

    this.setState({ isLoading: true });
    this.fetchReleases(releases)
      .then(() => this.fetchCloses(pendingCloses))
      .catch(error => this.handleReleaseError(error))
      .then(() => this.setState({ isLoading: false }))
      .then(() => this.clearPendingReleases());
  }

  render() {
    const { tracks } = this.props;
    const { archs, releasedChannels } = this.state;

    return (
      <Fragment>
        { this.state.error &&
          <Notification status="error" appearance="negative">
            {this.state.error}
          </Notification>
        }
        <RevisionsTable
          releasedChannels={releasedChannels}
          currentTrack={this.state.currentTrack}
          tracks={tracks}
          archs={archs}
          isLoading={this.state.isLoading}
          pendingReleases={this.state.pendingReleases}
          pendingCloses={this.state.pendingCloses}
          getNextReleasedChannels={this.getNextReleasedChannels.bind(this)}
          setCurrentTrack={this.setCurrentTrack.bind(this)}
          releaseRevisions={this.releaseRevisions.bind(this)}
          promoteRevision={this.promoteRevision.bind(this)}
          promoteChannel={this.promoteChannel.bind(this)}
          undoRelease={this.undoRelease.bind(this)}
          clearPendingReleases={this.clearPendingReleases.bind(this)}
          closeChannel={this.closeChannel.bind(this)}
        />
        <RevisionsList
          revisions={this.props.revisions}
          releasedChannels={releasedChannels}
          selectedRevisions={this.state.selectedRevisions}
          selectRevision={this.selectRevision.bind(this)}
        />
      </Fragment>
    );
  }
}

ReleasesController.propTypes = {
  snapName: PropTypes.string.isRequired,
  releasedChannels: PropTypes.object.isRequired,
  revisions: PropTypes.array.isRequired,
  tracks: PropTypes.array.isRequired,
  options: PropTypes.object.isRequired
};
