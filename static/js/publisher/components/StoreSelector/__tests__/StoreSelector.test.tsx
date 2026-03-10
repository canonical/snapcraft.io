import { BrowserRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { JotaiTestProvider, storesResponse } from "../../../test-utils";

import { brandStoresState } from "../../../state/brandStoreState";

import StoreSelector from "../StoreSelector";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useParams: () => ({
    id: "test-store-id",
  }),
  useNavigate: () => mockNavigate,
}));

function renderComponent() {
  return render(
    <BrowserRouter>
      <JotaiTestProvider initialValues={[[brandStoresState, storesResponse]]}>
        <StoreSelector />
      </JotaiTestProvider>
    </BrowserRouter>,
  );
}

describe("StoreSelector", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("displays a toggle button with the current store name", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: "Test store" }),
    ).toBeInTheDocument();
  });

  it("opens the store panel when the toggle button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Test store" }));

    await waitFor(() => {
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
    });
  });

  it("has a search input with a label for accessibility", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Test store" }));

    await waitFor(() => {
      expect(
        screen.getByRole("searchbox", { name: "Search stores" }),
      ).toBeInTheDocument();
    });
  });

  it("displays all stores in the dropdown when opened", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Test store" }));

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Global" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Test store" }),
      ).toBeInTheDocument();
    });
  });

  it("filters stores based on search input", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Test store" }));
    await user.type(screen.getByRole("searchbox"), "Test");

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Test store" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("option", { name: "Global" }),
      ).not.toBeInTheDocument();
    });
  });

  it("navigates to the selected store using react-router when nativeNavLink is not set", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Test store" }));

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Global" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option", { name: "Global" }));

    expect(mockNavigate).toHaveBeenCalledWith("/admin/ubuntu/snaps");
  });

  it("closes the panel after selecting a store", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Test store" }));

    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: "Global" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option", { name: "Global" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("option", { name: "Global" }),
      ).not.toBeInTheDocument();
    });
  });

  it("resets the search filter and closes the panel when the reset button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByRole("button", { name: "Test store" }));
    await user.type(screen.getByRole("searchbox"), "Test");

    await waitFor(() => {
      expect(
        screen.queryByRole("option", { name: "Global" }),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => {
      // Panel is closed after reset, so the search input is no longer visible
      expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    });
  });
});
