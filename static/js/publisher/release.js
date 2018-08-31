import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';

import RevisionsList from './release/revisionsList';
import RevisionsTable from './release/revisionsTable';


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

// getting list of tracks names from channel maps list
function getArchsFromChannelMap(channelMapsList) {
  const archs = [];

  channelMapsList.map(a => a.architecture).forEach(arch => {
    // if we haven't saved it yet
    if (archs.indexOf(arch) === -1) {
      archs.push(arch);
    }
  });

  return archs.sort();
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

const initReleases = (id, releasesData, channelMapsList, options) => {

  // init channel data in revisions list
  const revisionsMap = {};
  releasesData.revisions.forEach(rev => {
    rev.channels = [];
    revisionsMap[rev.revision] = rev;
  });

  // go through releases from older to newest
  releasesData.releases.slice().reverse().forEach(release => {
    if (release.revision) {
      const rev = revisionsMap[release.revision];

      if (rev) {
        const channel = release.track === 'latest'
          ? release.risk
          : `${release.track}/${release.risk}`;

        if (rev.channels.indexOf(`${release.track}/${release.risk}`) === -1) {
          rev.channels.push(channel);
        }
      }
    }
  });

  const releasedChannels = getReleaseDataFromChannelMap(channelMapsList, revisionsMap);
  const tracks = getTracksFromChannelMap(channelMapsList);
  const archs = getArchsFromChannelMap(channelMapsList);

  ReactDOM.render(
    <Fragment>
      <RevisionsTable releasedChannels={releasedChannels} tracks={tracks} archs={archs} options={options} />
      <RevisionsList revisions={releasesData.revisions} />
    </Fragment>,
    document.querySelector(id)
  );
};

export {
  initReleases
};
