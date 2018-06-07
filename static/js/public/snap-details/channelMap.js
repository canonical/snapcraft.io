/* global ga */

const LATEST = 'latest';

function setTrack(arch, track, packageName, channelMap) {
  ['stable', 'candidate', 'beta', 'edge'].forEach((risk, i, risks) => {
    const channelEl = document.getElementById(`js-channel-map-${risk}`);

    // channel names in tracks other then latest are prefixed with track name
    const channelName = track === LATEST ? risk : `${track}/${risk}`;

    channelEl.querySelector('.js-channel-name').innerHTML = channelName;
    let channelData = channelMap[channelName];

    // update install instructions
    let command = `sudo snap install ${packageName}`;

    if (track === LATEST) {
      if (risk !== 'stable') {
        command += ` --${risk}`;
      }
    } else {
      command += ` --channel=${track}/${risk}`;
    }

    channelEl.querySelector('input').value = command;

    const versionEl = channelEl.querySelector('.p-form-help-text');
    channelEl.classList.remove('p-channel-map__row--closed');

    // show version
    if (channelData) {
      versionEl.innerHTML = `Version: ${channelData.version}`;
    } else {
      let fallbackRisk;
      for (let j = 0; j < i; j++) {
        const channelName = track === LATEST ? risks[j] : `${track}/${risks[j]}`;
        if (channelMap[channelName]) {
          fallbackRisk = risks[j];
        }
      }

      if (fallbackRisk) {
        versionEl.innerHTML = `No release in ${risk} channel, using ${fallbackRisk} release.`;
      } else {
        versionEl.innerHTML = `No release in ${risk} channel.`;
        channelEl.classList.add('p-channel-map__row--closed');
      }
    }
  });
}


function getArchTrackChannels(arch, track, channelMapData) {
  const channels = channelMapData[arch][track];
  const archTrackChannels = {};

  channels.forEach(channel => {
    archTrackChannels[channel.channel] = channel;
  });

  return archTrackChannels;
}

function setArchitecture(arch, packageName, channelMapData) {
  if (!arch) {
    return;
  }

  const tracks = Object.keys(channelMapData[arch]);

  // split tracks into strings and numbers
  let numberTracks = [];
  let stringTracks = [];
  tracks.forEach(track => {
    // numbers are defined by any string starting any of the following patterns:
    //   just a number – 1,2,3,4,
    //   numbers on the left in a pattern – 2018.3 , 1.1, 1.1.23 ...
    //   or numbers on the left with strings at the end – 1.1-hotfix
    if (isNaN(parseInt(track.substr(0, 1)))) {
      stringTracks.push(track);
    } else {
      numberTracks.push(track);
    }
  });

  // Ignore case
  stringTracks.sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  const latestIndex = stringTracks.indexOf(LATEST);
  stringTracks.splice(latestIndex, 1);
  stringTracks = [LATEST].concat(stringTracks);

  // Sort numbers (that are actually strings)
  numberTracks.sort((a, b) => {
    return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Join the arrays together again
  const sortedTracks = stringTracks.concat(numberTracks);

  const track = sortedTracks[0];

  if (!track) {
    return;
  }

  // update tracks select
  const trackSelect = document.getElementById("js-channel-map-track-select");
  trackSelect.innerHTML = sortedTracks.map(track => `<option value="${track}">${track}</option>`).join('');
  trackSelect.value = track;

  // hide tracks if there is only one
  if (sortedTracks.length === 1) {
    trackSelect.closest('.js-channel-map-track-field').style.display = 'none';
  } else {
    trackSelect.closest('.js-channel-map-track-field').style.display = '';
  }

  const channelMap = getArchTrackChannels(arch, track, channelMapData);
  setTrack(arch, track, packageName, channelMap);
}

function selectTab(tabEl, tabsWrapperEl) {
  const selected = tabEl.getAttribute('aria-selected');
  if (!selected) {
    tabsWrapperEl.querySelector('.p-channel-map__tab.is-open').classList.remove('is-open');
    tabsWrapperEl.querySelector('.p-tabs__link[aria-selected]').removeAttribute('aria-selected');

    document.getElementById(tabEl.getAttribute('aria-controls')).classList.add('is-open');
    tabEl.setAttribute('aria-selected', "true");
  }
}

function initTabs(el) {
  el.addEventListener('click', (event) => {
    const target = event.target.closest('.p-tabs__link');

    if (target) {
      event.preventDefault();
      selectTab(target, el);
    }
  });
}

function initOpenSnapButtons() {
  let attempt = 1;

  document.addEventListener('click', (event) => {
    const openButton = event.target.closest('.js-open-snap-button');

    if (openButton) {
      const name = openButton.dataset.snap;
      let iframe = document.querySelector('.js-snap-open-frame');

      if (iframe) {
        iframe.parentNode.removeChild(iframe);
      }

      iframe = document.createElement('iframe');
      iframe.className = 'js-snap-open-frame';
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.src = `snap://${name}`;
      document.body.appendChild(iframe);

      if (typeof ga !== 'undefined') {
        // The first attempt should be counted towards the 'intent'
        let label = 'Snap install intent';
        let value = `${name}`;

        // Subsequent attempts should still be tracked, but not as 'intent'
        if (attempt > 1) {
          label = 'Snap install click';
          value += ` - click ${attempt}`;
        }

        ga('gtm1.send', {
          hitType: 'event',
          eventCategory: 'Snap details',
          eventAction: 'Click view in desktop store button',
          eventLabel: label,
          eventValue: value
        });
      }

      attempt += 1;
    }
  });
}

export default function initChannelMap(el, packageName, channelMapData) {
  initOpenSnapButtons();

  const channelMapEl = document.querySelector(el);
  const channelOverlayEl = document.querySelector('.p-channel-map-overlay');

  initTabs(channelMapEl);

  let closeTimeout;

  // init open/hide buttons
  const openChannelMap = (event) => {
    const openButton = event.target.closest('.js-open-channel-map');

    if (openButton) {
      // open tab based on button click (or install tab by default)
      const openTabName = openButton.getAttribute('aria-controls') || 'channel-map-tab-install';

      // clear hiding animation if it's still running
      clearTimeout(closeTimeout);

      const openTab = channelMapEl.querySelector(`.p-tabs__link[aria-controls=${openTabName}]`);

      // select default tab before opening
      selectTab(openTab, channelMapEl);

      // make sure overlay is displayed before CSS transitions are triggered
      channelOverlayEl.style.display = 'block';
      setTimeout(() => channelMapEl.classList.remove('is-closed'), 10);

      window.addEventListener('keyup', hideOnEscape);
      document.addEventListener('click', hideOnClick);

      if (typeof ga !== 'undefined') {
        ga('gtm1.send', {
          hitType: 'event',
          eventCategory: 'Snap details',
          eventAction: 'Open install dialog',
          eventLabel: `Open ${openTabName} dialog tab for ${packageName} snap`
        });
      }
    }
  };

  const hideChannelMap = () => {
    channelMapEl.classList.add('is-closed');
    // hide overlay after CSS transition is finished
    closeTimeout = setTimeout(() => channelOverlayEl.style.display = 'none', 500);

    window.removeEventListener('keyup', hideOnEscape);
    document.removeEventListener('click', hideOnClick);
  };

  const hideOnEscape = (event) => {
    if (event.key === "Escape" && !channelMapEl.classList.contains('is-closed')) {
      hideChannelMap();
    }
  };

  const hideOnClick = (event) => {
    // when channel map is not closed and clicking outside of it, close it
    if (!channelMapEl.classList.contains('is-closed') &&
        !event.target.closest(el)) {
      hideChannelMap();
    }
  };

  // show/hide when clicking on buttons
  document.addEventListener('click', openChannelMap);
  document.querySelector('.js-hide-channel-map').addEventListener('click', hideChannelMap);

  // get architectures from data
  const architectures = Object.keys(channelMapData);

  // initialize arch and track selects
  const archSelect = document.getElementById("js-channel-map-architecture-select");
  const trackSelect = document.getElementById("js-channel-map-track-select");

  archSelect.innerHTML = architectures.map(arch => `<option value="${arch}">${arch}</option>`).join('');

  archSelect.addEventListener('change', ()=> {
    setArchitecture(archSelect.value, packageName, channelMapData);
  });

  trackSelect.addEventListener('change', ()=> {
    const channels = getArchTrackChannels(archSelect.value, trackSelect.value, channelMapData);
    setTrack(archSelect.value, trackSelect.value, packageName, channels);
  });

  const arch = channelMapData['amd64'] ? 'amd64' : architectures[0];
  archSelect.value = arch;
  setArchitecture(arch, packageName, channelMapData);
}
