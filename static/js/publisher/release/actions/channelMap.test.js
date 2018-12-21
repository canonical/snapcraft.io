import {
  INIT_CHANNEL_MAP,
  SELECT_REVISION,
  CLEAR_SELECTED_REVISIONS,
  RELEASE_REVISION_SUCCESS,
  CLOSE_CHANNEL_SUCCESS,
  initChannelMap,
  selectRevision,
  toggleRevision,
  clearSelectedRevisions,
  releaseRevisionSuccess,
  closeChannelSuccess
} from "./channelMap";

describe("channelMap actions", () => {
  const channelMap = {
    "latest/beta": {
      test: {}
    }
  };

  const revision = {
    revision: 1,
    version: "1"
  };

  const channel = "test/edge";

  describe("initChannelMap", () => {
    it("should create an action to initialize channel map", () => {
      expect(initChannelMap(channelMap).type).toBe(INIT_CHANNEL_MAP);
    });

    it("should supply a payload with channel map data", () => {
      expect(initChannelMap(channelMap).payload.channelMap).toEqual(channelMap);
    });
  });

  describe("selectRevision", () => {
    it("should create an action to select revision", () => {
      expect(selectRevision(revision).type).toBe(SELECT_REVISION);
    });

    it("should supply a payload with revision data", () => {
      expect(selectRevision(revision).payload.revision).toEqual(revision);
    });

    it("should supply a payload with toggle set to false", () => {
      expect(selectRevision(revision).payload.toggle).toBe(false);
    });
  });

  describe("toggleRevision", () => {
    it("should create an action to select revision", () => {
      expect(toggleRevision(revision).type).toBe(SELECT_REVISION);
    });

    it("should supply a payload with revision data", () => {
      expect(toggleRevision(revision).payload.revision).toEqual(revision);
    });

    it("should supply a payload with toggle set to false", () => {
      expect(toggleRevision(revision).payload.toggle).toBe(true);
    });
  });

  describe("clearSelectedRevisions", () => {
    it("should create an action to clear selected revisions", () => {
      expect(clearSelectedRevisions().type).toBe(CLEAR_SELECTED_REVISIONS);
    });
  });

  describe("releaseRevisionSuccess", () => {
    it("should create an action to release revision", () => {
      expect(releaseRevisionSuccess(revision, channel).type).toBe(
        RELEASE_REVISION_SUCCESS
      );
    });

    it("should supply a payload with revision and channel", () => {
      const payload = releaseRevisionSuccess(revision, channel).payload;

      expect(payload.revision).toEqual(revision);
      expect(payload.channel).toEqual(channel);
    });
  });

  describe("closeChannelSuccess", () => {
    it("should create an action to close channel", () => {
      expect(closeChannelSuccess(channel).type).toBe(CLOSE_CHANNEL_SUCCESS);
    });

    it("should supply a payload with revision and channel", () => {
      expect(closeChannelSuccess(channel).payload.channel).toEqual(channel);
    });
  });
});
