import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

// TODO:
// - when version is the same but revision different it's not visible
// - when other revision is released 'over' other one, other one is still counted/listed
// - if already released version would be long showing release with -> will be off screen
export default class RevisionsTable extends Component {
  constructor() {
    super();

    // default to latest track
    this.state = {
      currentTrack: 'latest',
      releases: {} // revisions to be released
    };
  }

  // getting list of tracks names from track/channel names list
  getTracksFromChannels(releasedChannels) {
    const channels = Object.keys(releasedChannels);
    const tracks = ['latest'];

    channels.forEach(channel => {
      const split = channel.split('/');

      // if there is a track name in the channel name
      // and we haven't saved it yet
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
        // append 'latest' track to default channels
        if (channel.split('/').length === 1) {
          channel = `latest/${channel}`;
        }

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

  promoteRevision(revision, channel) {
    this.setState((state) => {
      const { releases } = state;

      if (!releases[revision.revision]) {
        releases[revision.revision] = {
          revision: revision,
          channels: []
        };
      }

      let channels = releases[revision.revision].channels;
      channels.push(channel);

      // make sure channels are unique
      channels = channels.filter((item, i, ar) => ar.indexOf(item) === i);

      releases[revision.revision].channels = channels;

      return {
        releases
      };
    });
  }

  undoRelease(revision, channel) {
    this.setState((state) => {
      const { releases } = state;

      if (releases[revision.revision]) {
        const channels = releases[revision.revision].channels;
        if (channels.indexOf(channel) !== -1) {
          channels.splice(channels.indexOf(channel), 1);
        }

        if (channels.length === 0) {
          delete releases[revision.revision];
        }
      }

      return {
        releases
      };
    });
  }

  getRevisionToDisplay(channels, nextReleases, channel, arch) {
    const pendingRelease = nextReleases[channel] && nextReleases[channel][arch];
    const currentRelease = channels[channel] && channels[channel][arch];

    return pendingRelease || currentRelease;
  }

  // TODO:
  // - tooltip for promote button
  // - tooltip for undo button
  // - bug when releasing 2 revisions to same channel
  renderRows(releaseData) {
    const { channels, archs } = releaseData;

    const nextChannelReleases = this.getNextReleasesData(channels, this.state.releases);

    const track = this.state.currentTrack;
    const RISKS = ['stable', 'candidate', 'beta', 'edge'];
    return RISKS.map((risk) => {
      const channel = `${track}/${risk}`;

      const release = channels[channel] || {};

      const releaseClick = (revision, track, risk) => {
        let targetRisk;
        targetRisk = RISKS[RISKS.indexOf(risk) - 1];
        if (targetRisk) {
          this.promoteRevision(revision, `${track}/${targetRisk}`);
        }
      };

      const undoClick = (revision, track, risk) => {
        this.undoRelease(revision, `${track}/${risk}`);
      };

      // TODO:
      // - move logic out of template
      return (
        <tr key={channel}>
          <td>{ channel }</td>
          {
            archs.map(arch => {
              // TODO: @bartaz - clean up this mess
              let canBePromoted = false;
              let thisRevision = this.getRevisionToDisplay(channels, nextChannelReleases, channel, arch);
              let targetRisk = RISKS[RISKS.indexOf(risk) - 1];
              let promotedRevision = this.getRevisionToDisplay(channels, nextChannelReleases, `${track}/${targetRisk}`, arch);


              if (risk !== 'stable' && thisRevision && (!promotedRevision || promotedRevision.revision !== thisRevision.revision)) {
                canBePromoted = true;
              }

              // if feature is disabled don't show the buttons
              if (!this.props.options.releaseUiEnabled) {
                canBePromoted = false;
              }

              let nextRelease;

              if (nextChannelReleases[channel] && nextChannelReleases[channel][arch]) {
                if (!release[arch] || release[arch].revision !== nextChannelReleases[channel][arch].revision) {
                  nextRelease = nextChannelReleases[channel][arch];
                }
              }

              return (
                <td
                  style={ { position: 'relative' } }
                  key={`${channel}/${arch}`}
                >
                  <span className="p-tooltip p-tooltip--btm-center">
                    <span className="p-release-version">
                      <span className={ nextRelease ? 'p-previous-revision' : '' }>
                        { release[arch] ? release[arch].version : '-' }
                      </span>
                      { nextRelease &&
                        <span> &rarr; { nextRelease.version }</span>
                      }
                    </span>

                    <span className="p-tooltip__message">
                      { release[arch] ? `${release[arch].version} (${release[arch].revision})` : 'None' }
                      { nextRelease &&
                        <span> &rarr; { `${nextRelease.version} (${nextRelease.revision})` }</span>
                      }
                    </span>
                  </span>
                  { (canBePromoted || nextRelease) &&
                    <div className="p-release-buttons">
                      { canBePromoted &&
                        <button className="p-icon-button" onClick={releaseClick.bind(this, thisRevision, track, risk)} title={`Promote ${thisRevision.version} (${thisRevision.revision})`}>&uarr;</button>
                      }
                      { nextRelease &&
                        <button className="p-icon-button" onClick={undoClick.bind(this, thisRevision, track, risk)} title={`Undo this release`}>&#x2715;</button>
                      }
                    </div>
                  }
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

  renderReleasesConfirm() {
    const { releases } = this.state;
    const releasesCount = Object.keys(releases).length;

    return (releasesCount > 0 &&
      <p>
        <span className="p-tooltip">
          { releasesCount } revision{ releasesCount > 1 ? 's' : '' } to release
          {' '}
          <i className="p-icon--question" />
          <span className="p-tooltip__message" role="tooltip" id="default-tooltip">
            { Object.keys(releases).map(revId => {
              const release = releases[revId];

              return <span key={revId}>
                {release.revision.version} ({release.revision.revision}) {release.revision.arch}
                {' '}
                to {release.channels.join(', ')}
                {'\n'}
              </span>;
            })}
          </span>
        </span>
        {' '}
        <button disabled title="Not implemented yet...">Apply</button>
        <button onClick={ this.onRevertClick.bind(this) }>Cancel</button>
      </p>
    );
  }

  onTrackChange(event) {
    this.setState({ currentTrack: event.target.value });
  }

  getNextReleasesData(currentReleaseData, releases) {
    const nextReleaseData = JSON.parse(JSON.stringify(currentReleaseData));

    // for each release
    Object.keys(releases).forEach(releasedRevision => {
      releases[releasedRevision].channels.forEach(channel => {
        const revision = releases[releasedRevision].revision;

        if (!nextReleaseData[channel]) {
          nextReleaseData[channel] = {};
        }

        revision.arch.split(', ').forEach(arch => {
          nextReleaseData[channel][arch] = revision;
        });
      });
    });

    return nextReleaseData;
  }

  onRevertClick() {
    this.setState({
      releases: {}
    });
  }

  render() {
    const releaseData = this.getReleaseDataFromList(this.props.revisions);

    return (
      <Fragment>
        <div className="u-clearfix">
          <h4 className="u-float--left">Releases available for install</h4>
          { releaseData.tracks.length > 1 && this.renderTrackDropdown(releaseData.tracks) }
        </div>
        { this.renderReleasesConfirm() }
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
  revisions: PropTypes.object.isRequired,
  options: PropTypes.object.isRequired
};
