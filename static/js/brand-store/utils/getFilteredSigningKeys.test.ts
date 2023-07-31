import getFilteredSigningKeys from "./getFilteredSigningKeys";

const mockSigningKeys = [
  {
    name: "signing-key-1",
    "created-at": "2022-07-18T13:03:11.095Z",
    "created-by": {
      "display-name": "John Doe",
      email: "john.doe@canonical.com",
      id: "asdf79807asdf9807",
      username: "johndoe",
      validation: "unproven",
    },
    "modified-at": "2022-07-18T14:03:11.095Z",
    "modified-by": {
      "display-name": "John Doe",
      email: "john.doe@canonical.com",
      id: "asdf79807asdf9807",
      username: "johndoe",
      validation: "unproven",
    },
    fingerprint: "fingerprint1",
    "sha3-384":
      "96c3bf18447370259bab86ccc650ed3fe9ffb3ec2f8d55b4beafc09efc38405ccecb9e3c0de86ae6f89466493fbf8bbe",
    models: [],
  },
  {
    name: "signing-key-2",
    "created-at": "2022-07-19T13:03:11.095Z",
    "created-by": {
      "display-name": "John Doe",
      email: "john.doe@canonical.com",
      id: "asdf79807asdf9807",
      username: "johndoe",
      validation: "unproven",
    },
    "modified-at": "2022-07-19T15:03:11.095Z",
    "modified-by": {
      "display-name": "John Doe",
      email: "john.doe@canonical.com",
      id: "asdf79807asdf9807",
      username: "johndoe",
      validation: "unproven",
    },
    fingerprint: "fingerprint1",
    "sha3-384":
      "98d5bf18447370259bab86ccc650ed3fe9ffb3ec2f8d55b4beafc09efc38405ccecb9e3c0de86ae6f89466493fbf8bbe",
    models: [],
  },
  {
    name: "signing-key-3",
    "created-at": "2022-07-20T13:03:11.095Z",
    "created-by": {
      "display-name": "John Doe",
      email: "john.doe@canonical.com",
      id: "asdf79807asdf9807",
      username: "johndoe",
      validation: "unproven",
    },
    "modified-at": "2022-07-20T15:03:11.095Z",
    "modified-by": {
      "display-name": "John Doe",
      email: "john.doe@canonical.com",
      id: "asdf79807asdf9807",
      username: "johndoe",
      validation: "unproven",
    },
    fingerprint: "fingerprint1",
    "sha3-384":
      "99a7bf18447370259bab86ccc650ed3fe9ffb3ec2f8d55b4beafc09efc38405ccecb9e3c0de86ae6f89466493fbf8bbe",
    models: [],
  },
];

describe("getFilteredSigningKeys", () => {
  it("returns unfiltered signing keys if no filter query", () => {
    expect(getFilteredSigningKeys(mockSigningKeys).length).toEqual(
      mockSigningKeys.length
    );
    expect(getFilteredSigningKeys(mockSigningKeys)[0].name).toEqual(
      mockSigningKeys[0].name
    );
    expect(getFilteredSigningKeys(mockSigningKeys)[1].name).toEqual(
      mockSigningKeys[1].name
    );
    expect(getFilteredSigningKeys(mockSigningKeys)[2].name).toEqual(
      mockSigningKeys[2].name
    );
  });

  it("returns no signing keys if filter query doesn't match", () => {
    expect(getFilteredSigningKeys(mockSigningKeys, "foobar").length).toEqual(0);
  });

  it("returns filtered signing keys if query matches", () => {
    expect(
      getFilteredSigningKeys(mockSigningKeys, "signing-key-1").length
    ).toBe(1);
    expect(
      getFilteredSigningKeys(mockSigningKeys, "signing-key-2")[0].name
    ).toEqual("signing-key-2");
  });
});
