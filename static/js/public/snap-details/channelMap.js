/* global ga */

import moment from '../../../../node_modules/moment/src/moment';
import globalEvents from '../../libs/events';

class ChannelMap {
  constructor(selectorString, packageName, channelMapData, defaultTrack) {
    this.RISK_ORDER = ['stable', 'candidate', 'beta', 'edge'];
    this.INSTALL_TEMPLATE = document.querySelector('[data-js="install-window"]').innerHTML;
    this.CHANNEL_ROW_TEMPLATE = document.querySelector('[data-js="channel-map-row"]').innerHTML;

    this.packageName = packageName;
    this.currentTab = 'overview';

    this.openDesktopAttempt = 1;

    if (!defaultTrack) {
      this.defaultTrack = 'latest';
    } else {
      this.defaultTrack = defaultTrack;
    }

    this.selectorString = selectorString;
    this.channelMapEl = document.querySelector(this.selectorString);
    this.channelOverlayEl = document.querySelector('.p-channel-map-overlay');
    this.channelMapData = channelMapData;

    // get architectures from data
    const architectures = Object.keys(this.channelMapData);

    // initialize architecture select
    const archSelect = document.querySelector('[data-js="arch-select"]');

    archSelect.innerHTML = architectures.map(arch => `<option value="${arch}">${arch}</option>`).join('');

    this.arch = this.channelMapData['amd64'] ? 'amd64' : architectures[0];

    // capture events
    this.bindEvents();
  }

  sortRows(rows){
    // split tracks into strings and numbers
    let numberTracks = [];
    let stringTracks = [];
    let latestTracks = [];
    rows.forEach(row => {
      // numbers are defined by any string starting any of the following patterns:
      //   just a number – 1,2,3,4,
      //   numbers on the left in a pattern – 2018.3 , 1.1, 1.1.23 ...
      //   or numbers on the left with strings at the end – 1.1-hotfix
      if (row[0] === this.defaultTrack) {
        latestTracks.push(row);
      } else if (isNaN(parseInt(row[0].substr(0, 1)))) {
        stringTracks.push(row);
      } else {
        numberTracks.push(row);
      }
    });

    // Ignore case
    stringTracks.sort(function (a, b) {
      return a[0].toLowerCase().localeCompare(b[0].toLowerCase());
    });

    stringTracks = latestTracks.concat(stringTracks);

    // Sort numbers (that are actually strings)
    numberTracks.sort((a, b) => {
      return b[0].localeCompare(a[0], undefined, { numeric: true, sensitivity: 'base' });
    });

    // Join the arrays together again

    return stringTracks.concat(numberTracks);
  }

  bindEvents() {
    globalEvents.addEvents({
      'click': {
        '[data-js="open-channel-map"]': (target, event) => {
          event.preventDefault();

          // If the button has already been clicked, close the channel map
          if (target === this.openButton) {
            this.closeChannelMap();
            this.openButton = null;
          } else {
            this.openChannelMap(target);
          }
        },

        '[data-js="close-channel-map"]': (target, event) => {
          event.preventDefault();

          this.closeChannelMap();
          this.openButton = null;
        },

        '[data-js="slide-all-versions"]': (target, event) => {
          event.preventDefault();
          this.slideToVersions(target);
        },

        '[data-js="switch-tab"]': (target, event) => {
          event.preventDefault();
          this.switchTab(target);
        },

        '[data-js="open-desktop"]': (target, event) => {
          event.preventDefault();
          this.openDesktop(target);
        },

        '[data-js="slide-install-instructions"]': (target, event) => {
          event.preventDefault();
          this.slideToInstructions(target);
        }
      },

      'change': {
        '[data-js="arch-select"]': (target) => {
          this.prepareTable(this.channelMapData[target.value]);
        }
      },

      'keyup': {
        'window': (target, event) => {
          this._closeOnEscape.call(this, event);
        }
      },

      'resize': {
        'window': this.positionChannelMap.bind(this)
      }
    });
  }

  positionChannelMap() {
    const windowWidth = document.body.scrollWidth;
    const buttonRect = this.openButton.getBoundingClientRect();
    const channelMapPosition = [
      windowWidth - buttonRect.right,
      buttonRect.y + buttonRect.height + 16 + window.scrollY
    ];

    this.channelMapEl.style.right = `${channelMapPosition[0]}px`;
    this.channelMapEl.style.top = `${channelMapPosition[1]}px`;
  }

  openChannelMap(openButton) {
    // Hide everything first, so we can click between
    this.closeChannelMap();

    this.openButton = openButton;

    this.openButton.classList.add('is-active');

    this.positionChannelMap();

    // open screen based on button click (or install screen by default)
    this.openScreenName = this.openButton.getAttribute('aria-controls') || 'channel-map-install';

    const openScreen = this.channelMapEl.querySelector(`#${this.openScreenName}`);

    // select default screen before opening
    this.selectScreen(openScreen);

    // If we're going to the 'other' screen, prepare the tables
    if (openButton.dataset.controls === 'channel-map-versions') {
      this.prepareTable(this.channelMapData[this.arch]);
    }

    this.channelOverlayEl.style.display = 'block';
    this.channelMapEl.classList.remove('is-closed');

    if (typeof ga !== 'undefined') {
      ga('gtm1.send', {
        hitType: 'event',
        eventCategory: 'Snap details',
        eventAction: 'Open install dialog',
        eventLabel: `Open ${this.openScreenName} dialog screen for ${this.packageName} snap`
      });
    }
  }

  closeChannelMap() {
    this.channelMapEl.classList.add('is-closed');
    const children = this.channelMapEl.children;
    for (let i = 0; i < children.length; i++) {
      const screenEl = children[i];
      screenEl.classList.remove('is-open');
      screenEl.removeAttribute('aria-selected');
    }
    this.channelOverlayEl.style.display = 'none';

    if (this.openButton) {
      this.openButton.classList.remove('is-active');
    }
  }

  _closeOnEscape(event) {
    if (event.key === "Escape" && !this.channelMapEl.classList.contains('is-closed')) {
      this.closeChannelMap();
    }
  }

  _closeOnClick(event) {
    // when channel map is not closed and clicking outside of it, close it
    if (!this.channelMapEl.classList.contains('is-closed') &&
      !event.target.closest(this.selectorString)) {
      this.closeChannelMap();
    }
  }

  openDesktop(clickEl) {
    const name = clickEl.dataset.snap.trim();
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
      if (this.openDesktopAttempt > 1) {
        label = 'Snap install click';
        value += ` - click ${this.openDesktopAttempt}`;
      }

      ga('gtm1.send', {
        hitType: 'event',
        eventCategory: 'Snap details',
        eventAction: 'Click view in desktop store button',
        eventLabel: label,
        eventValue: value
      });
    }

    this.openDesktopAttempt += 1;
  }

  selectScreen(screenEl) {
    const selected = screenEl.getAttribute('aria-selected');
    const currentlySelected = screenEl.parentNode.querySelector('.is-open');

    if (currentlySelected) {
      currentlySelected.classList.remove('is-open');
    }

    if (!selected) {
      screenEl.classList.add('is-open');
      screenEl.setAttribute('aria-selected', "true");
    }
  }

  slideToVersions(clickEl) {
    const slides = clickEl.closest('.p-channel-map__slides');
    slides.classList.add('show-left');
    slides.classList.remove('show-right');
  }

  slideToInstructions(clickEl) {
    // Add content to the right slide area
    this.writeInstallInstructions(clickEl.dataset.channel);

    const slides = clickEl.closest('.p-channel-map__slides');
    slides.classList.add('show-right');
    slides.classList.remove('show-left');
  }

  writeInstallInstructions(channel) {
    let paramString = '';

    if (channel.indexOf('latest') === 0) {
      if (channel.indexOf('stable') !== 7) {
        paramString = `--${channel.split('/')[1]}`;
      }
    } else {
      paramString = `--channel=${channel}`;
    }

    const template = this.INSTALL_TEMPLATE
      .split('${channel}')
      .join(channel)
      .split('${paramString}')
      .join(paramString);
    const holder = document.querySelector('[data-js="channel-map-install-details"]');

    holder.innerHTML = template;
  }

  writeTable(el, data) {
    let cache;
    const tbody = data.map((row, i) => {
      const isSameTrack = (cache && row[0] === cache);
      let rowClass = [];

      if (i === 0) {
        rowClass.push('is-highlighted');
      }

      if (isSameTrack) {
        rowClass.push('no-border');
      }

      let _row = this.CHANNEL_ROW_TEMPLATE
        .split('${rowClass}')
        .join(rowClass.join(' '));

      row.forEach((val, index) => {
        _row = _row.split('${row[' + index + ']}').join(val);
      });

      cache = row[0];
      return _row;
    });

    el.innerHTML = tbody.join('');
  }

  prepareTable(archData) {
    const tbodyEl = this.channelMapEl.querySelector('[data-js="channel-map-table"]');

    const filtered = this.currentTab === 'overview';

    let numberOfTracks = 0;
    let trimmedNumberOfTracks = 0;

    Object.keys(archData).forEach(arch => {
      numberOfTracks += archData[arch].length;
    });

    let rows = [];

    let trimmed = filtered ? {} : archData;

    if (filtered) {
      Object.keys(archData).forEach(track => {
        archData[track].sort((a, b) => {
          return this.RISK_ORDER.indexOf(a['risk']) - this.RISK_ORDER.indexOf(b['risk']);
        });

        if (track === this.defaultTrack) {
          trimmed[track] = archData[track];
          trimmedNumberOfTracks += trimmed[track].length;
        } else {
          trimmed[track] = [archData[track][0]];
          trimmedNumberOfTracks += 1;
        }
      });

      if (numberOfTracks === trimmedNumberOfTracks) {
        this.hideTabs();
      }
    }


    Object.keys(trimmed).forEach(track => {
      trimmed[track].forEach(trackInfo => {
        const trackName = track.split('/')[0];
        rows.push([
          trackName,
          trackInfo['risk'],
          trackInfo['version'],
          moment.utc(trackInfo['created-at']).fromNow()
        ]);
      });
    });

    this.writeTable(tbodyEl, this.sortRows(rows));
  }

  hideTabs() {
    const tabs = document.querySelector('[data-js="channel-map-tabs"]');

    if (tabs) {
      tabs.style.display = 'none';
    }
  }

  switchTab(clickEl) {
    const selected = clickEl.closest('.p-tabs').querySelector('[aria-selected="true"]');
    this.currentTab = clickEl.dataset.tab;
    selected.removeAttribute('aria-selected');
    clickEl.setAttribute('aria-selected', 'true');

    this.prepareTable(this.channelMapData[this.arch]);
  }
}

export default function channelMap(el, packageName, channelMapData, defaultTrack) {
  return new ChannelMap(el, packageName, channelMapData, defaultTrack);
}