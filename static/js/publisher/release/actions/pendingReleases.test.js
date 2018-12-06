import {
  PROMOTE_REVISION,
  UNDO_RELEASE,
  CANCEL_PENDING_RELEASES,
  promoteRevision,
  undoRelease,
  cancelPendingReleases
} from "./pendingReleases";

describe("pendingReleases actions", () => {
  const revision = { revision: 1, architectures: ["test64"] };
  const channel = "test/edge";

  describe("promoteRevision", () => {
    it("should create an action to promote revision", () => {
      expect(promoteRevision(revision, channel).type).toBe(PROMOTE_REVISION);
    });

    it("should supply a payload with revision", () => {
      expect(promoteRevision(revision, channel).payload.revision).toEqual(
        revision
      );
    });

    it("should supply a payload with channel", () => {
      expect(promoteRevision(revision, channel).payload.channel).toEqual(
        channel
      );
    });
  });

  describe("undoRelease", () => {
    it("should create an action to undo release of revision", () => {
      expect(undoRelease(revision, channel).type).toBe(UNDO_RELEASE);
    });

    it("should supply a payload with revision", () => {
      expect(undoRelease(revision, channel).payload.revision).toEqual(revision);
    });

    it("should supply a payload with channel", () => {
      expect(undoRelease(revision, channel).payload.channel).toEqual(channel);
    });
  });

  describe("cancelPendingReleases", () => {
    it("should create an action to cancel pending releases", () => {
      expect(cancelPendingReleases(revision, channel).type).toBe(
        CANCEL_PENDING_RELEASES
      );
    });
  });
});
