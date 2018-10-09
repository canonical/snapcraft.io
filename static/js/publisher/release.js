import React from 'react';
import ReactDOM from 'react-dom';

import ReleasesController from './release/releasesController';

// getting list of tracks names from channel maps list
function getTracksFromChannelMap(channelMapsList) {
  const tracks = ['latest'];

  channelMapsList.map(t => t.track).forEach(track => {
    // if we haven't saved it yet
    if (tracks.indexOf(track) === -1) {
      tracks.push(track);
    }
  });

  return tracks;
}

// transforming channel map list data into format used by this component
function getReleaseDataFromChannelMap(channelMapsList, revisionsMap) {
  const releasedChannels = {};
  const releasedArchs = {};

  channelMapsList.forEach((mapInfo) => {
    const { track, architecture, map } = mapInfo;
    map.forEach((channelInfo) => {
      if (channelInfo.info === 'released') {
        const channel = track === 'latest' ? `${track}/${channelInfo.channel}` : channelInfo.channel;

        if (!releasedChannels[channel]) {
          releasedChannels[channel] = {};
        }

        // XXX bartaz
        // this may possibly lead to issues with revisions in multiple architectures
        // if we have data about given revision in revision history we can store it
        if (revisionsMap[channelInfo.revision]) {
          releasedChannels[channel][architecture] = revisionsMap[channelInfo.revision];
        // but if for some reason we don't have full data about revision in channel map
        // we need to ducktype it from channel info
        } else {
          releasedChannels[channel][architecture] = channelInfo;
          releasedChannels[channel][architecture].architectures = [ architecture ];
        }

        releasedArchs[architecture] = true;
      }
    });
  });

  return releasedChannels;
}

const initReleases = (id, snapName, releasesData, channelMapsList, options) => {
  // init channel data in revisions list
  const revisionsMap = {};
  releasesData.revisions.forEach(rev => {
    rev.channels = [];
    revisionsMap[rev.revision] = rev;
  });

  // go through releases from older to newest
  releasesData.releases.slice().reverse().forEach(release => {
    if (release.revision && !release.branch) {
      const rev = revisionsMap[release.revision];

      if (rev) {
        const channel = release.track === 'latest'
          ? release.risk
          : `${release.track}/${release.risk}`;

        if (rev.channels.indexOf(channel) === -1) {
          rev.channels.push(channel);
        }
      }
    }
  });

  const releasedChannels = getReleaseDataFromChannelMap(channelMapsList, revisionsMap);
  const tracks = getTracksFromChannelMap(channelMapsList);

  ReactDOM.render(
    <ReleasesController
      snapName={snapName}
      releasedChannels={releasedChannels}
      revisions={releasesData.revisions}
      tracks={tracks}
      options={options}
    />,
    document.querySelector(id)
  );
};

export {
  initReleases
};
