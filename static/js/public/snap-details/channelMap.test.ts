import ChannelMap from "./channelMap";

describe("ChannelMap", () => {
  describe("formatSize", () => {
    let channelMap: ChannelMap;

    beforeEach(() => {
      // Create a minimal DOM structure for ChannelMap initialization
      document.body.innerHTML = `
        <div data-js="channel-map"></div>
        <div class="p-channel-map-overlay" data-js="close-channel-map"></div>
        <script type="text/template" id="channel-map-row-template"></script>
        <script type="text/template" id="channel-map-security-table-row-template"></script>
      `;
      channelMap = new ChannelMap(
        '[data-js="channel-map"]',
        "test-snap",
        "test-snap-id",
        {},
        "latest",
        false,
      );
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    it("should format 0 bytes correctly", () => {
      expect(channelMap.formatSize(0)).toBe("0 B");
    });

    it("should format bytes correctly", () => {
      expect(channelMap.formatSize(500)).toBe("500 B");
      expect(channelMap.formatSize(999)).toBe("999 B");
    });

    it("should format kilobytes correctly", () => {
      expect(channelMap.formatSize(1000)).toBe("1 kB");
      expect(channelMap.formatSize(1500)).toBe("1.5 kB");
      expect(channelMap.formatSize(50000)).toBe("50 kB");
    });

    it("should format megabytes correctly", () => {
      expect(channelMap.formatSize(1000000)).toBe("1 MB");
      expect(channelMap.formatSize(1500000)).toBe("1.5 MB");
      expect(channelMap.formatSize(52428800)).toBe("52.4 MB");
    });

    it("should format gigabytes correctly", () => {
      expect(channelMap.formatSize(1000000000)).toBe("1 GB");
      expect(channelMap.formatSize(1500000000)).toBe("1.5 GB");
      expect(channelMap.formatSize(5000000000)).toBe("5 GB");
    });

    it("should format terabytes correctly", () => {
      expect(channelMap.formatSize(1000000000000)).toBe("1 TB");
      expect(channelMap.formatSize(1500000000000)).toBe("1.5 TB");
    });

    it("should round to 1 decimal place", () => {
      expect(channelMap.formatSize(1234567)).toBe("1.2 MB");
      expect(channelMap.formatSize(1567890)).toBe("1.6 MB");
    });
  });
});
