import { UPDATE_REVISIONS, updateRevisions } from "./revisions";

describe("revisions actions", () => {
  describe("updateRevisions", () => {
    let revisions = {
      1: { revision: 1 },
      2: { revision: 2 },
      3: { revision: 3, channels: ["stable"] }
    };

    it("should create an action to update revisions list", () => {
      expect(updateRevisions(revisions).type).toBe(UPDATE_REVISIONS);
    });

    it("should supply a payload with revisions map", () => {
      expect(updateRevisions(revisions).payload.revisions).toEqual(revisions);
    });
  });
});
