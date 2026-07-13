import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import Remodel from "../Remodel";
import { useRemodels, useModels, useSortTableData } from "../../../hooks";

import type { UseQueryResult } from "react-query";
import type {
  ApiResponse,
  RemodelResponse,
  Model,
} from "../../../types/shared";

const mockFilterQuery = "test-model";

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useSearchParams: () => [new URLSearchParams({ filter: mockFilterQuery })],
}));

vi.mock("../../Portals/Portals", async (importOriginal) => ({
  ...(await importOriginal()),
  PortalEntrance: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("../../../hooks", () => ({
  useRemodels: vi.fn(),
  useModels: vi.fn(),
  useSortTableData: vi.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function renderComponent() {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Remodel />
      </QueryClientProvider>
    </BrowserRouter>,
  );
}

const useRemodelsNoPermissions = {
  data: {
    message: "There was a problem fetching remodels",
    success: false,
  },
  isLoading: false,
  isError: false,
} as UseQueryResult<ApiResponse<RemodelResponse>, Error>;

const useRemodelsPermissions = {
  data: {
    data: { allowlist: [], "next-cursor": null },
    success: true,
  },
  isLoading: false,
  isError: false,
} as unknown as UseQueryResult<ApiResponse<RemodelResponse>, Error>;

const useRemodelsWithData = {
  data: {
    data: {
      allowlist: [
        {
          "created-at": "2026-03-27T14:34:23.666Z",
          "created-by": "test-user",
          "from-model": "from-model-a",
          "from-serial": "serial-1",
          "modified-at": null,
          "modified-by": null,
          "to-model": "to-model-a",
          description: "test remodel",
        },
      ],
      "next-cursor": null,
    },
    success: true,
  },
  isLoading: false,
  isError: false,
} as unknown as UseQueryResult<ApiResponse<RemodelResponse>, Error>;

const useRemodelsWithMultipleData = {
  data: {
    data: {
      allowlist: [
        {
          "created-at": "2026-03-27T14:34:23.666Z",
          "created-by": "test-user",
          "from-model": "from-model-a",
          "from-serial": "serial-1",
          "modified-at": null,
          "modified-by": null,
          "to-model": "to-model-a",
          description: "test remodel",
        },
        {
          "created-at": "2026-03-28T14:34:23.666Z",
          "created-by": "test-user",
          "from-model": "from-model-b",
          "from-serial": "serial-2",
          "modified-at": null,
          "modified-by": null,
          "to-model": "to-model-b",
          description: "second remodel",
        },
        {
          "created-at": "2026-03-29T14:34:23.666Z",
          "created-by": "test-user",
          "from-model": "from-model-c",
          "from-serial": null,
          "modified-at": null,
          "modified-by": null,
          "to-model": "to-model-c",
          description: "third remodel",
        },
      ],
      "next-cursor": null,
    },
    success: true,
  },
  isLoading: false,
  isError: false,
} as unknown as UseQueryResult<ApiResponse<RemodelResponse>, Error>;

const mockUseModels = vi.mocked(useModels);
mockUseModels.mockReturnValue({
  data: [],
} as unknown as UseQueryResult<Model[], Error>);

const mockUseSortTableData = vi.mocked(useSortTableData);
mockUseSortTableData.mockReturnValue({
  rows: [],
  updateSort: vi.fn(),
});

const mockUseRemodels = vi.mocked(useRemodels);

describe("Remodel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("displays message if user has no remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsNoPermissions);
    renderComponent();
    expect(
      screen.getByText("There was a problem fetching remodels"),
    ).toBeInTheDocument();
  });

  it("doesn't display table if user has no remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsNoPermissions);
    renderComponent();
    expect(screen.queryByTestId("remodel-table")).not.toBeInTheDocument();
  });

  it("doesn't display 'Configure' button if user has no remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsNoPermissions);
    renderComponent();
    expect(
      screen.queryByRole("link", { name: "Configure remodels" }),
    ).not.toBeInTheDocument();
  });

  it("doesn't display message if user has remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsPermissions);
    renderComponent();
    expect(
      screen.queryByText("There was a problem fetching remodels"),
    ).not.toBeInTheDocument();
  });

  it("displays table if user has remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsPermissions);
    renderComponent();
    expect(screen.getByTestId("remodel-table")).toBeInTheDocument();
  });

  it("displays 'Configure' button if user has remodels access", () => {
    mockUseRemodels.mockReturnValue(useRemodelsPermissions);
    renderComponent();
    expect(
      screen.getByRole("link", { name: "Configure remodels" }),
    ).toBeInTheDocument();
  });

  it("updates remodel and shows success notification", async () => {
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const fetchMock = vi.fn(async (_url: string, options?: RequestInit) => {
      if (options?.method === "PATCH") {
        return {
          ok: true,
          json: async () => ({ success: true }),
        };
      }

      return {
        ok: true,
        json: async () => ({ success: true }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    mockUseRemodels.mockReturnValue(useRemodelsWithData);
    renderComponent();
    const user = userEvent.setup();

    const input = screen.getByDisplayValue("test remodel");
    await user.clear(input);
    await user.type(input, "updated remodel");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/models/remodel-allowlist"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            "from-model": "from-model-a",
            "to-model": "to-model-a",
            "from-serial": "serial-1",
            description: "updated remodel",
          }),
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": undefined,
          },
        }),
      );
    });

    expect(await screen.findByText("Remodel updated")).toBeInTheDocument();
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["remodels"],
    });
  });

  it("shows error notification when update fails", async () => {
    const errorMessage = "Unable to update remodel from API";
    const fetchMock = vi.fn(async (_url: string, options?: RequestInit) => {
      if (options?.method === "PATCH") {
        return {
          ok: true,
          json: async () => ({ success: false, message: errorMessage }),
        };
      }

      return {
        ok: true,
        json: async () => ({ success: true }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    mockUseRemodels.mockReturnValue(useRemodelsWithData);
    renderComponent();
    const user = userEvent.setup();

    const input = screen.getByDisplayValue("test remodel");
    await user.type(input, " edited");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it("shows bulk delete button as disabled when no items are selected", () => {
    mockUseRemodels.mockReturnValue(useRemodelsWithData);
    renderComponent();

    const deleteButton = screen.getByRole("button", { name: "Delete remodel" });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveAttribute("aria-disabled", "true");
  });

  it("enables bulk delete button with correct text for single item", async () => {
    mockUseRemodels.mockReturnValue(useRemodelsWithData);
    renderComponent();
    const user = userEvent.setup();

    // Click the checkbox for the first row
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);

    const deleteButton = screen.getByRole("button", { name: "Delete remodel" });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).not.toHaveAttribute("aria-disabled", "true");
  });

  it("enables bulk delete button with correct text for multiple items", async () => {
    mockUseRemodels.mockReturnValue(useRemodelsWithMultipleData);
    renderComponent();
    const user = userEvent.setup();

    // Click checkboxes for first two rows
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);

    const deleteButton = screen.getByRole("button", {
      name: "Delete 2 remodels",
    });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).not.toHaveAttribute("aria-disabled", "true");
  });

  it("opens bulk delete modal when bulk delete button is clicked", async () => {
    mockUseRemodels.mockReturnValue(useRemodelsWithData);
    renderComponent();
    const user = userEvent.setup();

    // Select an item
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);

    // Click bulk delete button
    await user.click(screen.getByRole("button", { name: "Delete remodel" }));

    // Modal should be visible
    expect(
      screen.getByRole("heading", { name: "Delete remodel" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete this remodel\?/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This action cannot be undone\./),
    ).toBeInTheDocument();
  });

  it("closes bulk delete modal when cancel is clicked", async () => {
    mockUseRemodels.mockReturnValue(useRemodelsWithData);
    renderComponent();
    const user = userEvent.setup();

    // Select an item and open modal
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole("button", { name: "Delete remodel" }));

    // Click cancel in modal
    const cancelButtons = screen.getAllByRole("button", { name: "Cancel" });
    await user.click(cancelButtons[cancelButtons.length - 1]);

    // Modal should be closed
    await waitFor(() => {
      expect(
        screen.queryByText("Are you sure you want to delete this remodel?"),
      ).not.toBeInTheDocument();
    });
  });

  it("shows list of remodels in bulk delete modal for multiple items", async () => {
    mockUseRemodels.mockReturnValue(useRemodelsWithMultipleData);
    renderComponent();
    const user = userEvent.setup();

    // Select two items
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);

    // Click bulk delete button
    await user.click(screen.getByRole("button", { name: "Delete 2 remodels" }));

    // Modal should show list of remodels
    expect(
      screen.getByRole("heading", { name: "Delete 2 remodels" }),
    ).toBeInTheDocument();
    expect(screen.getByText("from-model-a → to-model-a")).toBeInTheDocument();
    expect(screen.getByText("(Serial: serial-1)")).toBeInTheDocument();
    expect(screen.getByText("from-model-b → to-model-b")).toBeInTheDocument();
    expect(screen.getByText("(Serial: serial-2)")).toBeInTheDocument();
  });

  it("bulk deletes remodels and shows success notification", async () => {
    const invalidateQueriesSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined);
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    mockUseRemodels.mockReturnValue(useRemodelsWithMultipleData);
    renderComponent();
    const user = userEvent.setup();

    // Select two items
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);

    // Click bulk delete button
    await user.click(screen.getByRole("button", { name: "Delete 2 remodels" }));

    // Click delete in modal
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/models/remodel-allowlist"),
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify([
            {
              "from-model": "from-model-a",
              "to-model": "to-model-a",
              "from-serial": "serial-1",
            },
            {
              "from-model": "from-model-b",
              "to-model": "to-model-b",
              "from-serial": "serial-2",
            },
          ]),
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": undefined,
          },
        }),
      );
    });
    expect(await screen.findByText("2 remodels deleted")).toBeInTheDocument();
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ["remodels"],
    });
  });

  it("shows correct success message for single remodel bulk delete", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    mockUseRemodels.mockReturnValue(useRemodelsWithData);
    renderComponent();
    const user = userEvent.setup();

    // Select one item
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);

    // Click bulk delete button and confirm
    await user.click(screen.getByRole("button", { name: "Delete remodel" }));
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(await screen.findByText("1 remodel deleted")).toBeInTheDocument();
  });

  it("shows error notification when bulk delete fails", async () => {
    const errorMessage = "Unable to delete remodels from API";
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: false, message: errorMessage }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    mockUseRemodels.mockReturnValue(useRemodelsWithMultipleData);
    renderComponent();
    const user = userEvent.setup();

    // Select items
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);
    await user.click(checkboxes[2]);

    // Click bulk delete button and confirm
    await user.click(screen.getByRole("button", { name: "Delete 2 remodels" }));
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it("disables bulk delete button while deleting", async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const fetchMock = vi.fn(async () => promise);
    vi.stubGlobal("fetch", fetchMock);

    mockUseRemodels.mockReturnValue(useRemodelsWithData);
    renderComponent();
    const user = userEvent.setup();

    // Select an item
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);

    // Click bulk delete button
    await user.click(screen.getByRole("button", { name: "Delete remodel" }));

    // Click delete in modal
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    // Check that the modal Delete button is disabled while deleting
    await waitFor(() => {
      const modalDeleteButtons = screen.getAllByRole("button", {
        name: /Delete|Deleting/,
      });
      // The last button should be the modal button
      const modalButton = modalDeleteButtons[modalDeleteButtons.length - 1];
      expect(modalButton).toHaveAttribute("aria-disabled", "true");
    });

    // Resolve the promise to complete the test
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  it("clears selection after successful bulk delete", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    mockUseRemodels.mockReturnValue(useRemodelsWithData);
    renderComponent();
    const user = userEvent.setup();

    // Select an item
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);

    // Confirm bulk delete button is visible
    expect(
      screen.getByRole("button", { name: "Delete remodel" }),
    ).toBeInTheDocument();

    // Click bulk delete button and confirm
    await user.click(screen.getByRole("button", { name: "Delete remodel" }));
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    // Wait for success notification
    await screen.findByText("1 remodel deleted");

    // Bulk delete button should be disabled (selection cleared)
    await waitFor(() => {
      const deleteButton = screen.getByRole("button", {
        name: "Delete remodel",
      });
      expect(deleteButton).toHaveAttribute("aria-disabled", "true");
    });
  });
});
