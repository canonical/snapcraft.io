import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { screen, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import Publicise from "../Publicise";

const queryClient = new QueryClient();

const renderComponent = (view?: "badges" | "cards" | undefined) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Publicise view={view} />
      </BrowserRouter>
      ,
    </QueryClientProvider>,
  );
};

const mockPubliciseData = {
  is_released: true,
  private: false,
  trending: false,
};

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

beforeEach(() => {
  mockPubliciseData.private = false;
});

describe("Publicise", () => {
  test("notification if private", () => {
    // @ts-expect-error Mocking useQuery to return mock publicise data
    useQuery.mockReturnValue({
      isLoading: false,
      isFetched: true,
      data: { data: mockPubliciseData },
    });
    renderComponent();
    expect(screen.getByText(/Make your snap public/)).toBeInTheDocument();
  });

  test("disabled if private", () => {
    mockPubliciseData.private = true;

    // @ts-expect-error Mocking useQuery to return mock publicise data
    useQuery.mockReturnValue({
      isLoading: false,
      isFetched: true,
      data: { data: mockPubliciseData },
    });
    renderComponent();
    expect(
      screen.getByText(/When your snap is public and has a release/),
    ).toBeInTheDocument();
  });

  test("renders section navigation", () => {
    renderComponent();

    expect(
      screen.getByRole("link", { name: "Snap Store buttons" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "GitHub badges" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Embeddable cards" }),
    ).toBeInTheDocument();
  });

  test("renders buttons by default", () => {
    renderComponent();
    expect(
      screen.getByText(/You can help translate these buttons/),
    ).toBeInTheDocument();
  });

  test("renders badges if passed argument", () => {
    renderComponent("badges");
    expect(
      screen.getByText(/Stable channel from default track/),
    ).toBeInTheDocument();
  });

  test("renders cards if passed argument", () => {
    renderComponent("cards");
    expect(screen.getByText(/Snap Store button:/)).toBeInTheDocument();
  });
});
