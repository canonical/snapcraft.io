/* eslint-disable @typescript-eslint/ban-ts-comment */
import SnapEvents from "../../libs/events";
import { triggerEvent } from "../../base/ga";

interface SnapElement extends HTMLElement {
  dataset: {
    snap: string;
  };
}

function isSnapElement(target: HTMLElement): target is SnapElement {
  return (
    (target as SnapElement).dataset &&
    (target as SnapElement).dataset.snap !== undefined
  );
}

interface SlideInstallInstructionsElement extends HTMLElement {
  dataset: {
    channel: string;
    confinement: string;
  } & DOMStringMap;
  closest: (selector: string) => Element | null;
}

interface ChannelData {
  track: string;
  confinement: string;
  "released-at": string;
  risk: string;
  version: string;
  channel?: string;
}

type ChannelMapData = Record<string, Record<string, ChannelData[]>>;

class ChannelMap {
  RISK_ORDER: string[];
  packageName: string;
  currentTab: string;
  defaultTrack: string;
  selectorString: string;
  channelMapEl: HTMLElement;
  channelOverlayEl: HTMLElement;
  channelMapData: ChannelMapData;
  events: SnapEvents;
  INSTALL_TEMPLATE: string = "";
  CHANNEL_ROW_TEMPLATE: string | undefined;
  arch: string | undefined;
  openButton: HTMLElement | null | undefined;
  openScreenName: string | undefined;
  constructor(
    selectorString: string,
    packageName: string,
    channelMapData: ChannelMapData,
    defaultTrack: string,
  ) {
    this.RISK_ORDER = ["stable", "candidate", "beta", "edge"];
    this.packageName = packageName;
    this.currentTab = "overview";

    this.defaultTrack = defaultTrack;

    this.selectorString = selectorString;
    this.channelMapEl = document.querySelector(
      this.selectorString,
    ) as HTMLElement;
    this.channelOverlayEl = document.querySelector(
      ".p-channel-map-overlay",
    ) as HTMLElement;
    this.channelMapData = channelMapData;

    if (!this.channelOverlayEl) {
      throw new Error("The channel map HTML is not present");
    }

    this.events = new SnapEvents(this.channelMapEl.parentNode);

    this.initOtherVersions();

    // capture events
    this.bindEvents();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sortRows(rows: any[]) {
    // split tracks into strings and numbers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const numberTracks: Array<any> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stringTracks: Array<any> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestTracks: any[] = [];
    rows.forEach((row) => {
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
      return b[0].localeCompare(a[0], undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    // Join the arrays together again

    return stringTracks.concat(numberTracks);
  }

  initOtherVersions() {
    let installTemplateEl = document.querySelector(
      '[data-js="install-window"]',
    );
    if (!installTemplateEl) {
      installTemplateEl = document.getElementById("install-window-template");
    }
    let channelRowTemplateEl = document.querySelector(
      '[data-js="channel-map-row"]',
    );
    if (!channelRowTemplateEl) {
      channelRowTemplateEl = document.getElementById(
        "channel-map-row-template",
      );
    }

    if (!installTemplateEl || !channelRowTemplateEl) {
      const buttonsVersions = document.querySelector(
        ".p-snap-install-buttons__versions",
      ) as HTMLElement;
      buttonsVersions.style.display = "none";
      return false;
    }

    this.INSTALL_TEMPLATE = installTemplateEl.innerHTML;
    this.CHANNEL_ROW_TEMPLATE = channelRowTemplateEl.innerHTML;

    // get architectures from data
    const architectures = Object.keys(this.channelMapData);

    // initialize architecture select
    const archSelect = document.querySelector(
      '[data-js="arch-select"]',
    ) as HTMLElement;

    archSelect.innerHTML = architectures
      .map((arch) => `<option value="${arch}">${arch}</option>`)
      .join("");

    this.arch = this.channelMapData["amd64"] ? "amd64" : architectures[0];

    return;
  }

  private isTabClickElement(
    target: HTMLElement,
  ): target is HTMLElement & { dataset: { tab: string } } {
    return "tab" in target.dataset;
  }
  bindEvents() {
    this.events.addEvents({
      click: {
        '[data-js="open-channel-map"]': (
          event: { preventDefault: () => void },
          target: HTMLElement,
        ) => {
          event.preventDefault();

          // If the button has already been clicked, close the channel map
          if (
            this.openButton instanceof HTMLElement &&
            target instanceof HTMLElement &&
            target === this.openButton
          ) {
            this.closeChannelMap();
            this.openButton = null;
          } else {
            this.openChannelMap(target);

            triggerEvent(
              this.openScreenName === "channel-map-install" ? "cta-0" : "cta-1",
              window.location.href,
              target.dataset.controls ?? "",
              target.innerText,
            );
          }
        },

        '[data-js="close-channel-map"]': (event: Event) => {
          event.preventDefault();

          this.closeChannelMap();
          this.openButton = null;
        },

        '[data-js="slide-all-versions"]': (
          event: Event,
          target: HTMLElement,
        ) => {
          event.preventDefault();
          this.slideToVersions(target);
        },

        '[data-js="switch-tab"]': (
          event: { preventDefault: () => void },
          target: HTMLElement,
        ) => {
          event.preventDefault();
          if (this.isTabClickElement(target)) {
            this.switchTab(target);
          }
        },

        '[data-js="open-desktop"]': (event: Event, target: HTMLElement) => {
          if (isSnapElement(target)) {
            event.preventDefault();
            this.openDesktop(target);
            triggerEvent(
              "cta-1",
              window.location.href,
              `snap://${target.dataset.snap}`,
              target.innerText,
            );
          } else {
            console.error("Target is not a SnapElement");
          }
        },

        '[data-js="slide-install-instructions"]': (
          event: Event & { preventDefault: () => void },
          target: HTMLElement,
        ) => {
          event.preventDefault();

          if (
            target instanceof HTMLElement &&
            target.dataset.channel &&
            target.dataset.confinement
          ) {
            const slideTarget = target as SlideInstallInstructionsElement;
            this.slideToInstructions(slideTarget);
          } else {
            console.error("Target is not a SlideInstallInstructionsElement");
          }
        },
      },
      change: {
        '[data-js="arch-select"]': (
          _event: Event,
          target: HTMLSelectElement,
        ) => {
          const selectedArch = target.value;

          if (selectedArch in this.channelMapData) {
            this.prepareTable(this.channelMapData[selectedArch]);
          } else {
            console.error(`No data found for architecture: ${selectedArch}`);
          }
        },
      },
    });

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.events.addEvent("keyup", window, (event: any) => {
      this._closeOnEscape.call(this, event);
    });

    // @ts-ignore
    this.events.addEvent("resize", window, () => {
      this.positionChannelMap.bind(this);
    });
  }

  positionChannelMap() {
    if (!this.openButton) {
      return;
    }
    const windowWidth = document.body.scrollWidth;
    const buttonRect = this.openButton.getBoundingClientRect();
    const channelMapPosition = [
      windowWidth - buttonRect.right,
      buttonRect.y + buttonRect.height + 16 + window.scrollY,
    ];

    this.channelMapEl.style.right = `${channelMapPosition[0]}px`;
    this.channelMapEl.style.top = `${channelMapPosition[1]}px`;
  }

  openChannelMap(openButton: HTMLElement) {
    // Hide everything first, so we can click between
    this.closeChannelMap();

    this.openButton = openButton;

    this.openButton.classList.add("is-active");

    this.positionChannelMap();

    // open screen based on button click (or install screen by default)
    this.openScreenName =
      // @ts-ignore
      this.openButton.getAttribute("aria-controls") || "channel-map-install";

    const openScreen = this.channelMapEl.querySelector(
      `#${this.openScreenName}`,
    ) as HTMLElement;

    // select default screen before opening
    this.selectScreen(openScreen);

    // If we're going to the 'other' screen, prepare the tables
    if (openButton.dataset.controls === "channel-map-versions") {
      // @ts-ignore
      this.prepareTable(this.channelMapData[this.arch]);
    }

    this.channelOverlayEl.style.display = "block";
    this.channelMapEl.classList.remove("is-closed");
  }

  closeChannelMap() {
    this.channelMapEl.classList.add("is-closed");
    const children = this.channelMapEl.children;
    for (let i = 0; i < children.length; i++) {
      const screenEl = children[i];
      screenEl.classList.remove("is-open");
      screenEl.removeAttribute("aria-selected");
    }
    this.channelOverlayEl.style.display = "none";

    if (this.openButton) {
      this.openButton.classList.remove("is-active");
    }
  }

  _closeOnEscape(event: { key: string }) {
    if (
      event.key === "Escape" &&
      !this.channelMapEl.classList.contains("is-closed")
    ) {
      this.closeChannelMap();
    }
  }

  _closeOnClick(event: MouseEvent) {
    // when channel map is not closed and clicking outside of it, close it
    const target = event.target as HTMLElement;
    if (
      !this.channelMapEl.classList.contains("is-closed") &&
      !target.closest(this.selectorString)
    ) {
      this.closeChannelMap();
    }
  }

  openDesktop(clickEl: HTMLElement) {
    const name = clickEl.dataset.snap?.trim() || "";
    let iframe = document.querySelector(
      ".js-snap-open-frame",
    ) as HTMLIFrameElement | null;

    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }

    iframe = document.createElement("iframe");
    iframe.className = "js-snap-open-frame";
    iframe.style.position = "absolute";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.src = `snap://${name}`;
    document.body.appendChild(iframe);
  }

  selectScreen(screenEl: HTMLElement) {
    const selected = screenEl.getAttribute("aria-selected");
    let currentlySelected;
    if (screenEl.parentNode) {
      currentlySelected = screenEl.parentNode.querySelector(".is-open");
    }

    if (currentlySelected) {
      currentlySelected.classList.remove("is-open");
    }

    if (!selected) {
      screenEl.classList.add("is-open");
      screenEl.setAttribute("aria-selected", "true");
    }
  }

  slideToVersions(clickEl: HTMLElement) {
    const slides = clickEl.closest(".p-channel-map__slides");
    if (slides instanceof HTMLElement) {
      slides.classList.add("show-left");
      slides.classList.remove("show-right");
    }
  }

  slideToInstructions(clickEl: HTMLElement) {
    const channel = clickEl.dataset.channel;
    const confinement = clickEl.dataset.confinement;

    if (channel && confinement) {
      this.writeInstallInstructions(channel, confinement);
    } else {
      console.error("Missing channel or confinement data");
    }

    const slides = clickEl.closest(".p-channel-map__slides");
    if (slides instanceof HTMLElement) {
      slides.classList.add("show-right");
      slides.classList.remove("show-left");
    }
  }

  writeInstallInstructions(channel: string, confinement: string): void {
    let paramString = "";

    // By default no params are required
    // If you switch risk on the default track you can use the shorthand --{risk} syntax
    // For all other tracks and risks, use the full --channel={channel} syntax
    if (channel.indexOf(`${this.defaultTrack}`) === 0) {
      if (channel !== `${this.defaultTrack}/stable`) {
        paramString = ` --${channel.split("/")[1]}`;
      }
    } else {
      paramString = ` --channel=${channel}`;
    }

    if (confinement === "classic") {
      paramString += ` --classic`;
    }

    let warning = "";
    if (channel.indexOf("edge") > -1) {
      warning = "Snaps on the edge channel can break and change often.";
    } else if (channel.indexOf("beta") > -1) {
      warning =
        "Snaps on the beta channel may have unfinished parts, breaking changes may occur.";
    } else if (channel.indexOf("candidate") > -1) {
      warning =
        "Snaps on the candidate channel need additional real world experimentation before the move to stable.";
    }

    const template = this.INSTALL_TEMPLATE.split("${channel}")
      .join(channel)
      .split("${paramString}")
      .join(paramString);

    const newDiv = document.createElement("div");
    newDiv.innerHTML = template;

    const warningEl = newDiv.querySelector("[data-js='warning']");
    if (warningEl) {
      warningEl.innerHTML = warning;
    }

    const holder = document.querySelector(
      '[data-js="channel-map-install-details"]',
    ) as HTMLElement;

    holder.innerHTML = newDiv.innerHTML;
  }

  writeTable(el: HTMLElement, data: string[][]): void {
    let cache: string | undefined;
    const tbody = data.map((row, i) => {
      const isSameTrack = cache && row[0] === cache;
      const rowClass: string[] = [];

      if (i === 0) {
        rowClass.push("is-highlighted");
      }

      if (isSameTrack) {
        rowClass.push("no-border");
      }

      let _row: string = "";

      if (this.CHANNEL_ROW_TEMPLATE) {
        _row = this.CHANNEL_ROW_TEMPLATE.split("${rowClass}").join(
          rowClass.join(" "),
        );
      }

      row.forEach((val, index) => {
        _row = _row.split("${row[" + index + "]}").join(val || "");
      });

      cache = row[0];
      return _row;
    });

    el.innerHTML = tbody.join("");
  }

  /**
   * Prepare the channel map tables
   *
   * @param {Object} archData
   * @param {Record<string, Array.<{channel: string, confinement: string, 'released-at': string, risk: string, size: number, version: string}>>} archData.track
   */
  prepareTable(archData: Record<string, ChannelData[]>) {
    const tbodyEl = this.channelMapEl.querySelector(
      '[data-js="channel-map-table"]',
    ) as HTMLElement;

    // If we're on the overview tab we only want to see latest/[all risks]
    // and [all tracks]/[highest risk], so filter out anything that isn't these
    const filtered = this.currentTab === "overview";

    const numberOfTracks = Object.values(archData).flat().length;

    let trimmedNumberOfTracks = 0;

    const rows: Array<string[]> = [];

    const trackList = filtered ? {} : archData;

    if (filtered) {
      Object.keys(archData).forEach((track) => {
        // Sort by risk
        archData[track].sort((a, b) => {
          return (
            this.RISK_ORDER.indexOf(a.risk) - this.RISK_ORDER.indexOf(b.risk)
          );
        });
        // Only the default track has all risks
        // Other tracks should show the highest risk
        if (track === this.defaultTrack) {
          trackList[track] = archData[track];
          trimmedNumberOfTracks += trackList[track].length;
        } else {
          trackList[track] = [archData[track][0]];
          trimmedNumberOfTracks += 1;
        }
      });

      // If we're filtering, but that list ends up with the same number of tracks
      // we don't need to show the tabs (we'll show the same data twice)
      if (numberOfTracks === trimmedNumberOfTracks) {
        this.hideTabs();
      }
    }

    // Create an array of columns
    Object.keys(trackList).forEach((track) => {
      trackList[track].forEach((trackInfo) => {
        const trackName = track.split("/")[0];
        rows.push([
          trackName,
          trackInfo["risk"],
          trackInfo["version"],
          trackInfo["released-at"],
          trackInfo["confinement"],
        ]);
      });
    });

    this.writeTable(tbodyEl, this.sortRows(rows));
  }

  hideTabs() {
    const tabs = document.querySelector(
      '[data-js="channel-map-tabs"]',
    ) as HTMLElement;

    if (tabs) {
      tabs.style.display = "none";
    }
  }

  switchTab(clickEl: HTMLElement) {
    const tabsContainer = clickEl.closest(".p-tabs");
    if (!(tabsContainer instanceof HTMLElement)) {
      console.error("Tabs container not found");
      return;
    }

    const selected = tabsContainer.querySelector('[aria-selected="true"]');
    if (!(selected instanceof HTMLElement)) {
      console.error("No selected tab found");
      return;
    }

    const tab = clickEl.dataset.tab;
    if (!tab) {
      console.error("No tab data found on clicked element");
      return;
    }

    this.currentTab = tab;
    selected.removeAttribute("aria-selected");
    clickEl.setAttribute("aria-selected", "true");

    if (this.arch && this.arch in this.channelMapData) {
      this.prepareTable(this.channelMapData[this.arch]);
    } else if (this.arch) {
      console.error(`No data found for architecture: ${this.arch}`);
    }
  }
}

export default function channelMap(
  el: string,
  packageName: string,
  channelMapData: ChannelMapData,
  defaultTrack: string,
) {
  return new ChannelMap(el, packageName, channelMapData, defaultTrack);
}
