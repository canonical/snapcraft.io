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


let closeTimeout;
let channelMapSelector;
let channelMapEl;
let channelOverlayEl;

// init open/hide buttons
const openChannelMap = (event) => {
  if (event.target.classList.contains('js-open-channel-map')) {
    // clear hiding animation if it's still running
    clearTimeout(closeTimeout);

    // make sure overlay is displayed before CSS transitions are triggered
    channelOverlayEl.style.display = 'block';
    setTimeout(() => channelMapEl.classList.remove('is-closed'), 10);

    window.addEventListener('keyup', hideOnEscape);

    if (typeof ga !== 'undefined') {
      ga('gtm1.send', {
        hitType: 'event',
        eventCategory: 'Snap details',
        eventAction: 'Open install dialog',
        eventLabel: `Open install dialog for ${packageName} snap`
      });
    }
  }
};

const hideChannelMap = (e) => {
  channelMapEl.classList.add('is-closed');
  // hide overlay after CSS transition is finished
  closeTimeout = setTimeout(() => channelOverlayEl.style.display = 'none', 500);

  window.removeEventListener('keyup', hideOnEscape);
};

const hideOnEscape = (event) => {
  if (event.key === "Escape" && !channelMapEl.classList.contains('is-closed')) {
    hideChannelMap();
  }
};

export function initChannelMap(el, packageName) {
  initOpenSnapButtons();

  channelMapSelector = el;
  channelMapEl = document.querySelector(channelMapSelector);
  channelOverlayEl = document.querySelector('.p-channel-map-overlay');

  // show/hide when clicking on buttons
  document.addEventListener('click', openChannelMap);
  document.querySelector('.js-hide-channel-map').addEventListener('click', hideChannelMap);
  document.querySelector('.p-channel-map-overlay').addEventListener('click', hideChannelMap);
}

export function showChannelMap(e, track, channel) {
  openChannelMap(e);
  console.log(track, channel);
}
