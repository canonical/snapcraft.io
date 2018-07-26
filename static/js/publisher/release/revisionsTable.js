import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

// TODO:
// - when version is the same but revision different it's not visible
// - when other revision is released 'over' other one, other one is still counted/listed
// - when revision is the same button is not needed (nothing to promote)
//    - or when it was just clicked to be released there
// - when revision has multiple architectures promoting doesn't work (in one of the archs)
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

      // TODO:
      // - move logic out of template
      // - check if release is possible (should button be rendered)
      // - check if something is released in top level (for better styling)
      return (
        <tr key={channel}>
          <td>{ channel }</td>
          {
            archs.map(arch => {
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
                  title={ release[arch] ? release[arch].version : null }
                >
                  { release[arch] ? release[arch].version : '-' }
                  { nextRelease &&
                    <span> &rarr; { nextRelease.version }</span>
                  }

                  { ((release[arch] || nextRelease) && risk !== 'stable') &&
                    <div style={{ position: 'absolute', right: '5px', top: '5px' }}>
                      <button onClick={releaseClick.bind(this, (nextRelease || release[arch]), track, risk)} title={`Promote ${(nextRelease || release[arch]).version} (${(nextRelease || release[arch]).revision})`}>&uarr;</button>
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

        nextReleaseData[channel][revision.arch] = revision;
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
        { Object.keys(this.state.releases).length > 0 &&
          <p>{ Object.keys(this.state.releases).length } revision{ Object.keys(this.state.releases).length > 1 ? 's' : '' } to release <button disabled title="Not implemented yet...">Apply</button> <button onClick={ this.onRevertClick.bind(this) }>Cancel</button></p>
        }
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
