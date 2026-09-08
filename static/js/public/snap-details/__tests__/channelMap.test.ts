import { describe } from "vitest";
import { getByText } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import channelMap, { type ChannelMapData } from "../channelMap";
// @ts-expect-error importing the HTML template as a string
import CHANNEL_MAP_HTML from "../../../../../templates/store/snap-details/_channel_map.html?raw";

const OPEN_CHANNEL_MAP_BTN = `
  <button
    id="open-channel-map"
    class="p-button"
    data-js="open-channel-map"
    data-controls="channel-map-versions"
    aria-controls="channel-map-versions">
    Open channel map
  </button>`;

function openChannelMap() {
  document.querySelector<HTMLButtonElement>("#open-channel-map")!.click();
}

const now = new Date();
const today = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(now);
const oneYearAgo = today.replace(
  now.getFullYear().toString(),
  (now.getFullYear() - 1).toString(),
);
const twoYearsAgo = today.replace(
  now.getFullYear().toString(),
  (now.getFullYear() - 2).toString(),
);

const selector = "#js-channel-map";
const packageName = "Test package";
const snapId = "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const channelMapData = {
  amd64: {
    latest: [
      {
        channel: "stable",
        confinement: "strict",
        "released-at": oneYearAgo,
        revision: "1",
        risk: "stable",
        size: 100,
        version: "1.0-amd64",
        track: "latest",
        sboms: null,
      },
      {
        channel: "candidate",
        confinement: "strict",
        "released-at": oneYearAgo,
        revision: "2",
        risk: "candidate",
        size: 100,
        version: "1.1-amd64",
        track: "latest",
        sboms: null,
      },
      {
        channel: "beta",
        confinement: "strict",
        "released-at": oneYearAgo,
        revision: "2",
        risk: "beta",
        size: 100,
        version: "1.1-amd64",
        track: "latest",
        sboms: null,
      },
      {
        channel: "edge",
        confinement: "strict",
        "released-at": oneYearAgo,
        revision: "3",
        risk: "edge",
        size: 100,
        version: "1.2-amd64",
        track: "latest",
        sboms: null,
      },
      {
        channel: "old",
        confinement: "strict",
        "released-at": twoYearsAgo,
        revision: "1",
        risk: "stable",
        size: 100,
        version: "0.1-amd64",
        track: "latest",
        sboms: null,
      },
    ],
  },
  arm64: {
    latest: [
      {
        channel: "stable",
        confinement: "strict",
        "released-at": oneYearAgo,
        revision: "4",
        risk: "stable",
        size: 100,
        version: "1.0-arm64",
        track: "latest",
        sboms: null,
      },
      {
        channel: "candidate",
        confinement: "strict",
        "released-at": oneYearAgo,
        revision: "2",
        risk: "candidate",
        size: 100,
        version: "1.1-arm64",
        track: "latest",
        sboms: null,
      },
      {
        channel: "beta",
        confinement: "strict",
        "released-at": oneYearAgo,
        revision: "5",
        risk: "beta",
        size: 100,
        version: "1.1-arm64",
        track: "latest",
        sboms: null,
      },
      {
        channel: "edge",
        confinement: "strict",
        "released-at": oneYearAgo,
        revision: "6",
        risk: "edge",
        size: 100,
        version: "1.2-arm64",
        track: "latest",
        sboms: null,
      },
      {
        channel: "old",
        confinement: "strict",
        "released-at": twoYearsAgo,
        revision: "1",
        risk: "stable",
        size: 100,
        version: "0.1-arm64",
        track: "latest",
        sboms: null,
      },
    ],
  },
};
const channelMapDataWithSboms = {
  ...channelMapData,
  amd64: {
    latest: channelMapData.amd64.latest.map((channel, index) =>
      index === 0
        ? {
            ...channel,
            sboms: [
              {
                format: "spdx",
                url: "https://example.com/test.spdx.json",
              },
            ],
          }
        : channel,
    ),
  },
};
const defaultTrack = "latest";

function setupChannelMap(data: ChannelMapData = channelMapData) {
  document.body.innerHTML = `
    ${OPEN_CHANNEL_MAP_BTN}
    ${CHANNEL_MAP_HTML}`;

  channelMap(selector, packageName, snapId, data, defaultTrack);

  openChannelMap();
}

describe("Channel map popup", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("with default channel data", () => {
    beforeEach(() => {
      setupChannelMap();
    });

    test("renders correctly", () => {
      const tbody = document.querySelector(`tbody`)!;
      expect(tbody.childElementCount).toEqual(
        channelMapData["amd64"].latest.length,
      );
    });

    test("architecture select updates table", async () => {
      const user = userEvent.setup();

      const select = document.querySelector<HTMLSelectElement>(
        `[data-js="arch-select"]`,
      )!;
      await user.selectOptions(select, "arm64");

      const tbody = document.querySelector(`tbody`)!;
      expect(getByText(tbody!, `1.0-arm64`)).not.toBeNull();
    });

    test("clicking on install shows instructions", async () => {
      const user = userEvent.setup();
      const btn = document.querySelector(
        `[data-js="slide-install-instructions"]`,
      )!;
      await user.click(btn);

      expect(document.querySelector(`.p-channel-map__slides`)).toHaveClass(
        "show-right",
      );
    });

    test("clicking on install shows instructions for selected channel", async () => {
      const user = userEvent.setup();
      const btn = document.querySelector(
        `[data-js="slide-install-instructions"][data-channel="latest/beta"]`,
      )!;
      await user.click(btn);

      expect(getByText(document.body, /--beta/)).not.toBeNull();
    });

    test("edge channel has warning", async () => {
      const user = userEvent.setup();
      const btn = document.querySelector(
        `[data-js="slide-install-instructions"][data-channel="latest/edge"]`,
      )!;
      await user.click(btn);

      expect(getByText(document.body, /edge channel can break/)).not.toBeNull();
    });

    test("beta channel has warning", async () => {
      const user = userEvent.setup();
      const btn = document.querySelector(
        `[data-js="slide-install-instructions"][data-channel="latest/beta"]`,
      )!;
      await user.click(btn);

      expect(
        getByText(document.body, /beta channel may have unfinished parts/),
      ).not.toBeNull();
    });

    test("candidate channel has warning", async () => {
      const user = userEvent.setup();
      const btn = document.querySelector(
        `[data-js="slide-install-instructions"][data-channel="latest/candidate"]`,
      )!;
      await user.click(btn);

      expect(
        getByText(
          document.body,
          /candidate channel need additional real world experimentation/,
        ),
      ).not.toBeNull();
    });

    test("old snaps have warning", async () => {
      const user = userEvent.setup();
      const btn = document.querySelector(
        `[data-js="slide-install-instructions"][data-channel="latest/old"]`,
      )!;
      await user.click(btn);

      expect(getByText(document.body, /might be unmaintained/)).not.toBeNull();
    });
  });

  describe("with SBOM data", () => {
    beforeEach(() => {
      setupChannelMap(channelMapDataWithSboms);
    });

    test("security tab shows SBOM download links", async () => {
      const user = userEvent.setup();
      const securityTab = document.querySelector<HTMLElement>(
        "#channel-map-security-tab",
      )!;

      await user.click(securityTab);

      const securityTable = document.querySelector(
        ".p-channel-map__security-table",
      )!;
      const versionTable = document.querySelector(
        ".p-channel-map__version-table",
      )!;
      const securityTableBody = document.querySelector(
        '[data-js="channel-map-security-table"]',
      )!;
      const sbomDownloadLink = securityTableBody.querySelector("a")!;
      const sbomRow = sbomDownloadLink.closest("tr")!;

      expect(securityTable).not.toHaveClass("u-hide");
      expect(securityTable).toHaveAttribute("aria-hidden", "false");
      expect(versionTable).toHaveClass("u-hide");
      expect(versionTable).toHaveAttribute("aria-hidden", "true");
      expect(sbomRow).toHaveTextContent("latest/stable");
      expect(sbomRow).toHaveTextContent("1.0-amd64");
      expect(sbomRow).toHaveTextContent("1");
      expect(sbomDownloadLink).toHaveTextContent("SPDX file");
      expect(sbomDownloadLink).toHaveAttribute(
        "href",
        "https://example.com/test.spdx.json",
      );
      expect(sbomDownloadLink).toHaveAttribute("download");
    });
  });
});
