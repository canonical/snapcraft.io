import getChanges from "../getChanges";

describe("getChanges", () => {
  test("returns changes in data", () => {
    const changedFields = {
      description: true,
      summary: true,
    };
    const data = {
      snap_name: "test-snap",
      description: "lorem ipsum",
      summary: "lorem ipsum dolor sit amet",
    };

    const changes = getChanges(changedFields, data);

    expect(changes.description).toBe("lorem ipsum");
    expect(changes.summary).toBe("lorem ipsum dolor sit amet");
    expect(changes.snap_name).not.toBeDefined();
  });

  test("doesn't return changes for forbidden keys", () => {
    const changedFields = {
      "primary-category": true,
      "secondary-category": true,
      contacts: true,
      donations: true,
      issues: true,
      "source-code": true,
      websites: true,
      licenses: true,
    };

    const data = {
      "primary-category": "health-and-fitness",
      "secondary-category": "music-and-audio",
      contacts: [{ url: "mailto:name@example.com" }],
      donations: [{ url: "https://example.com" }],
      issues: [{ url: "https://example.com" }],
      "source-code": [{ url: "https://example.com" }],
      websites: [{ url: "https://example.com" }],
      licenses: [{ key: "Glide", name: "3dfx Glide License" }],
    };

    const changes = getChanges(changedFields, data);

    expect(changes["primary-category"]).not.toBeDefined();
    expect(changes["secondary-category"]).not.toBeDefined();
    expect(changes.contacts).not.toBeDefined();
    expect(changes.donations).not.toBeDefined();
    expect(changes.issues).not.toBeDefined();
    expect(changes["source-code"]).not.toBeDefined();
    expect(changes.websites).not.toBeDefined();
    expect(changes.licenses).not.toBeDefined();
  });
});
