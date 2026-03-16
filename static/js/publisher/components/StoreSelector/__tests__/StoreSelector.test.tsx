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
    document.body.innerHTML = "";
    mockNavigate.mockReset();
  });

  it("displays a combobox", () => {
    renderComponent();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("combobox has an input with the current store name", () => {
    renderComponent();
    const input = screen.getByRole<HTMLInputElement>("searchbox");
    expect(input).toBeInTheDocument();
    expect(input.value).toEqual("Test store");
  });

  it("triggers navigation when changing combobox value", async () => {
    const user = userEvent.setup();
    renderComponent();

    const { id: storeId, name: storeName } = storesResponse[0];

    await user.click(screen.getByRole("button", { name: "open menu" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("option", { name: storeName }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("option", { name: storeName }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/admin/${storeId}/snaps`);
    });
  });
});
