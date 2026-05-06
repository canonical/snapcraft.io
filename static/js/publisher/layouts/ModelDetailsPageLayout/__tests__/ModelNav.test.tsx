import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom";

import ModelNav from "../ModelNav";
import { useRemodels, useSerialLogs } from "../../../hooks";

import type { UseQueryResult } from "react-query";
import type {
  ApiResponse,
  RemodelResponse,
  SerialLogResponse,
} from "../../../types/shared";

vi.mock("../../../hooks", () => ({
  useRemodels: vi.fn(),
  useSerialLogs: vi.fn(),
}));

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
  it("highlights the correct navigation item", () => {
    const mockUseRemodels = vi.mocked(useRemodels);
    mockUseRemodels.mockReturnValue({
      data: {
        success: true,
        data: {
          allowlist: [],
          "next-cursor": null,
        },
      },
    } as unknown as UseQueryResult<ApiResponse<RemodelResponse>, Error>);

    const mockUseSerialLogs = vi.mocked(useSerialLogs);
    mockUseSerialLogs.mockReturnValue({
      data: {
        success: true,
        data: {
          items: [],
          "next-cursor": null,
        },
      },
    } as unknown as UseQueryResult<ApiResponse<SerialLogResponse>, Error>);

    renderComponent("policies");
    const currentLink = screen.getByRole("tab", { name: "Policies" });
    expect(currentLink.getAttribute("aria-selected")).toBe("true");
  });

  it("doesn't highlight other navigation links", () => {
    const mockUseRemodels = vi.mocked(useRemodels);
    mockUseRemodels.mockReturnValue({
      data: {
        success: true,
        data: {
          allowlist: [],
          "next-cursor": null,
        },
      },
    } as unknown as UseQueryResult<ApiResponse<RemodelResponse>, Error>);

    const mockUseSerialLogs = vi.mocked(useSerialLogs);
    mockUseSerialLogs.mockReturnValue({
      data: {
        success: true,
        data: {
          items: [],
          "next-cursor": null,
        },
      },
    } as unknown as UseQueryResult<ApiResponse<SerialLogResponse>, Error>);

    renderComponent("policies");
    const currentLink = screen.getByRole("tab", { name: "Overview" });
    expect(currentLink.getAttribute("aria-selected")).toBe("false");
  });

  it("shows Remodel tab when useRemodels returns success: true", () => {
    const mockUseRemodels = vi.mocked(useRemodels);
    mockUseRemodels.mockReturnValue({
      data: {
        success: true,
        data: {
          allowlist: [],
          "next-cursor": null,
        },
      },
    } as unknown as UseQueryResult<ApiResponse<RemodelResponse>, Error>);

    const mockUseSerialLogs = vi.mocked(useSerialLogs);
    mockUseSerialLogs.mockReturnValue({
      data: {
        success: true,
        data: {
          items: [],
          "next-cursor": null,
        },
      },
    } as unknown as UseQueryResult<ApiResponse<SerialLogResponse>, Error>);

    renderComponent("overview");
    expect(screen.getByRole("tab", { name: "Remodel" })).toBeInTheDocument();
  });

  it("hides Remodel tab when useRemodels returns success: false", () => {
    const mockUseRemodels = vi.mocked(useRemodels);
    mockUseRemodels.mockReturnValue({
      data: {
        success: false,
        message: "Remodeling not available",
        data: {
          allowlist: [],
          "next-cursor": null,
        },
      },
    } as unknown as UseQueryResult<ApiResponse<RemodelResponse>, Error>);

    const mockUseSerialLogs = vi.mocked(useSerialLogs);
    mockUseSerialLogs.mockReturnValue({
      data: {
        success: false,
        data: {
          items: [],
          "next-cursor": null,
        },
      },
    } as unknown as UseQueryResult<ApiResponse<SerialLogResponse>, Error>);

    renderComponent("overview");
    expect(
      screen.queryByRole("tab", { name: "Remodel" }),
    ).not.toBeInTheDocument();
  });

  it("hides Remodel tab when useRemodels returns no data", () => {
    const mockUseRemodels = vi.mocked(useRemodels);
    mockUseRemodels.mockReturnValue({
      data: undefined,
    } as unknown as UseQueryResult<ApiResponse<RemodelResponse>, Error>);

    const mockUseSerialLogs = vi.mocked(useSerialLogs);
    mockUseSerialLogs.mockReturnValue({
      data: undefined,
    } as unknown as UseQueryResult<ApiResponse<SerialLogResponse>, Error>);

    renderComponent("overview");
    expect(
      screen.queryByRole("tab", { name: "Remodel" }),
    ).not.toBeInTheDocument();
  });
});
