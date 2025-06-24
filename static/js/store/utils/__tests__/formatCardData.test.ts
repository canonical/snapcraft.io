import formatCardData from "../formatCardData";

const mockRecommendationData = {
  details: {
    developer_validation: "starred",
    icon: "https://example.com/icon.png",
    snap_id: "test-snap-id",
    name: "test-snap-name",
    publisher: "Canonical",
    summary: "Test snap summary",
    title: "Test snap title",
  },
};

describe("formatCardData", () => {
  test("formats recommendation data into card data format", () => {
    expect(formatCardData(mockRecommendationData)).toEqual({
      package: {
        description: "Test snap summary",
        display_name: "Test snap title",
        icon_url: "https://example.com/icon.png",
        name: "test-snap-name",
      },
      publisher: {
        display_name: "Canonical",
        name: "Canonical",
        validation: "starred",
      },
    });
  });
});
