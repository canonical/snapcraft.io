import { BrowserRouter } from "react-router-dom";
import { render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";

import ActiveDeviceAnnotation from "../ActiveDeviceAnnotation";

const queryClient = new QueryClient();

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ActiveDeviceAnnotation snapId="test" />
      </BrowserRouter>
    </QueryClientProvider>,
  );
};

const mockMetricsAnnotation = {
  buckets: ["2019-02-08", "2024-07-01", "2019-01-24"],
  name: "annotations",
  series: [
    {
      date: "2019-01-24",
      display_date: "January 2019",
      display_name: "Server and cloud",
      name: "server-and-cloud",
      values: [0, 0, 1],
    },
    {
      date: "2019-02-08",
      display_date: "February 2019",
      display_name: "Development",
      name: "development",
      values: [1, 0, 0],
    },
    {
      date: "2024-07-01",
      display_date: "July 2024",
      display_name: "Featured",
      name: "featured",
      values: [0, 1, 0],
    },
  ],
};

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

describe("ActiveDeviceAnnotation", () => {
  test("renders the information correctly", async () => {
    // @ts-expect-error mocks
    useQuery.mockReturnValue({
      status: "success",
      data: mockMetricsAnnotation,
    });

    const { container } = renderComponent();

    await waitFor(() => {
      const serverAndCloudElement = container.querySelector(
        '[data-id="category-server-and-cloud"]',
      );
      expect(serverAndCloudElement).toBeInTheDocument();
      expect(serverAndCloudElement).toHaveTextContent(
        "Added to Server and cloud in January 2019",
      );

      const categoryDevelopmentElement = container.querySelector(
        '[data-id="category-development"]',
      );
      expect(categoryDevelopmentElement).toBeInTheDocument();
      expect(categoryDevelopmentElement).toHaveTextContent(
        "Added to Development in February 2019",
      );

      const categoryFeaturedElement = container.querySelector(
        '[data-id="category-featured"]',
      );
      expect(categoryFeaturedElement).toBeInTheDocument();
      expect(categoryFeaturedElement).toHaveTextContent(
        "Featured snap since July 2024",
      );
    });
  });

  test("renders empty annotations if the data is returned empty", async () => {
    // @ts-expect-error mocks
    useQuery.mockReturnValue({
      status: "success",
      data: {
        buckets: [],
        name: "annotations",
        series: [],
      },
    });

    const { container } = renderComponent();

    await waitFor(() => {
      const serverAndCloudElement = container.querySelector(
        '[data-id="category-server-and-cloud"]',
      );
      expect(serverAndCloudElement).not.toBeInTheDocument();
    });
  });
});
