import { UPDATE_ARCHITECTURES, updateArchitectures } from "./architectures";

describe("architectures actions", () => {
  describe("updateArchitectures", () => {
    let revisions = [
      { revision: 1, architectures: ["amd64", "armhf"] },
      { revision: 2, architectures: ["test", "test2"] },
      {
        revision: 3,
        channels: ["stable"],
        architectures: ["amd64", "test2"],
      },
    ];

    it("should create an action to update architectures list", () => {
      expect(updateArchitectures(revisions).type).toBe(UPDATE_ARCHITECTURES);
    });

    it("should supply a payload with architectures", () => {
      expect(updateArchitectures(revisions).payload.architectures).toEqual([
        "amd64",
        "armhf",
        "test",
        "test2",
      ]);
    });
  });
});
