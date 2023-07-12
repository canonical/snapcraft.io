import getFilteredPolicies from "./getFilteredPolicies";

const mockPolicies = [
  {
    "created-at": "2023-07-05T15:11:21.922Z",
    "created-by": "publisherId",
    "model-name": "model-1",
    revision: 1,
    "signing-key-sha3-384":
      "95d3bf18447370259bab86ccc650ed3fe9ffb3ec2f8d55b4beafc09efc38405ccecb9e3c0de86ae6f89466493fbf8bbe",
  },
  {
    "created-at": "2023-07-05T15:12:00.978Z",
    "created-by": "publisherId",
    "model-name": "model-2",
    revision: 5,
    "signing-key-sha3-384":
      "5d81aace4895e5d9d8e4acec88c5cfbde4dade62cecfe6aa26167ad8127aaa5b866ae4d1786f6be1667e87be3b7abbe6",
  },
  {
    "created-at": "2023-07-05T15:12:47.701Z",
    "created-by": "publisherId",
    "model-name": "model-3",
    revision: 43,
    "signing-key-sha3-384":
      "7a46d3f9afa14ce259726b5abf7c154b9ee20df97b80403792c9076551ae618bdfdf63dd2a57e81b4dd0c1a1b68940b6",
  },
];

describe("getFilteredPolicies", () => {
  it("returns unfiltered policies if no filter query", () => {
    expect(getFilteredPolicies(mockPolicies).length).toEqual(
      mockPolicies.length
    );
    expect(getFilteredPolicies(mockPolicies)[0]["revision"]).toEqual(
      mockPolicies[0]["revision"]
    );
    expect(getFilteredPolicies(mockPolicies)[1]["revision"]).toEqual(
      mockPolicies[1]["revision"]
    );
    expect(getFilteredPolicies(mockPolicies)[2]["revision"]).toEqual(
      mockPolicies[2]["revision"]
    );
  });

  it("returns no policies if filter query doesn't match", () => {
    expect(getFilteredPolicies(mockPolicies, "foobar").length).toEqual(0);
  });

  it("returns filtered policies if query matches", () => {
    expect(getFilteredPolicies(mockPolicies, "43").length).toBe(1);
    expect(getFilteredPolicies(mockPolicies, "43")[0]["revision"]).toEqual(43);
  });
});
