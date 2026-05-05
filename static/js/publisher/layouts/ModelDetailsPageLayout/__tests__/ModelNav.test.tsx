import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom";

import ModelNav from "../ModelNav";
import { useEndpointAvailability } from "../../../hooks";

vi.mock("../../../hooks", () => ({
  useEndpointAvailability: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: "test-id", modelId: "test-model-id" })),
  };
});

vi.mock("../../../state/brandStoreState", () => ({
  brandIdState: "mock-brand-id",
}));

vi.mock("jotai", () => ({
  useAtomValue: vi.fn(() => "mock-brand-id"),
}));

const queryClient = new QueryClient();

const renderComponent = (sectionName: string) => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ModelNav sectionName={sectionName} />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

describe("ModelNav", () => {
  const mockUseEndpointAvailability = vi.mocked(useEndpointAvailability);

  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("highlights the correct navigation item", () => {
    mockUseEndpointAvailability.mockReturnValue({
      isRemodelAvailable: true,
      isSerialLogAvailable: true,
    });

    renderComponent("policies");
    const currentLink = screen.getByRole("tab", { name: "Policies" });
    expect(currentLink.getAttribute("aria-selected")).toBe("true");
  });

  it("doesn't highlight other navigation links", () => {
    mockUseEndpointAvailability.mockReturnValue({
      isRemodelAvailable: true,
      isSerialLogAvailable: true,
    });

    renderComponent("policies");
    const currentLink = screen.getByRole("tab", { name: "Overview" });
    expect(currentLink.getAttribute("aria-selected")).toBe("false");
  });

  it("shows Remodel tab when endpoint is available", () => {
    mockUseEndpointAvailability.mockReturnValue({
      isRemodelAvailable: true,
      isSerialLogAvailable: false,
    });

    renderComponent("overview");
    expect(screen.getByRole("tab", { name: "Remodel" })).toBeInTheDocument();
  });

  it("hides Remodel tab when endpoint is not available", () => {
    mockUseEndpointAvailability.mockReturnValue({
      isRemodelAvailable: false,
      isSerialLogAvailable: false,
    });

    renderComponent("overview");
    expect(
      screen.queryByRole("tab", { name: "Remodel" }),
    ).not.toBeInTheDocument();
  });

  it("shows Serial log tab when endpoint is available", () => {
    mockUseEndpointAvailability.mockReturnValue({
      isRemodelAvailable: false,
      isSerialLogAvailable: true,
    });

    renderComponent("overview");
    expect(screen.getByRole("tab", { name: "Serial log" })).toBeInTheDocument();
  });

  it("hides Serial log tab when endpoint is not available", () => {
    mockUseEndpointAvailability.mockReturnValue({
      isRemodelAvailable: false,
      isSerialLogAvailable: false,
    });

    renderComponent("overview");
    expect(
      screen.queryByRole("tab", { name: "Serial log" }),
    ).not.toBeInTheDocument();
  });
});
