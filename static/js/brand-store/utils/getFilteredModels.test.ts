import getFilteredModels from "./getFilteredModels";

const mockModels = [
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

describe("getFilteredModels", () => {
  it("returns unfiltered models if no filter query", () => {
    expect(getFilteredModels(mockModels).length).toEqual(mockModels.length);
    expect(getFilteredModels(mockModels)[0].name).toEqual(mockModels[0].name);
    expect(getFilteredModels(mockModels)[1].name).toEqual(mockModels[1].name);
    expect(getFilteredModels(mockModels)[2].name).toEqual(mockModels[2].name);
  });

  it("returns no models if filter query doesn't match", () => {
    expect(getFilteredModels(mockModels, "foobar").length).toEqual(0);
  });

  it("returns filtered models if query matches", () => {
    expect(getFilteredModels(mockModels, "model-2").length).toBe(1);
    expect(getFilteredModels(mockModels, "model-2")[0].name).toEqual("model-2");
  });
});
