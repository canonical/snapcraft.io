import checkModelNameExists from "./checkModelNameExists";

const models = [
  {
    name: "model-1",
    "api-key": "e15a9abc390b4514a35752f5851e27b8",
    "created-at": "2022-03-29T13:03:11.095Z",
    "created-by": "publisherId",
    "modified-at": "2023-06-27T13:06:25.541Z",
    "modified-by": "publisherId",
  },
  {
    name: "model-2",
    "api-key": "80eb997804364d1a9008777584082e3d",
    "created-at": "2018-07-14T13:03:35.452Z",
    "created-by": "publisherId",
    "modified-at": "2023-06-29T13:06:52.630Z",
    "modified-by": "publisherId",
  },
  {
    name: "model-3",
    "api-key": "fea502ee59c249369073b96034b56770",
    "created-at": "2021-10-31T13:07:10.090Z",
    "created-by": "publisherId",
    "modified-at": "2023-06-29T13:03:35.452Z",
    "modified-by": "publisherId",
  },
];

describe("checkModelNameExists", () => {
  it("returns true if the new model name matches any existing models", () => {
    expect(checkModelNameExists("model-1", models)).toBe(true);
  });

  it("returns false if the new model name doesn't match any existing models", () => {
    expect(checkModelNameExists("model-4", models)).toBe(false);
  });
});
