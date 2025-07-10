import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { atom as jotaiAtom } from "jotai";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Filter from "../Filter";

import { JotaiTestProvider } from "../../../test-utils";

const mockFilterState = jotaiAtom("" as string);

const searchInputLabel = "Test filter label";

const queryClient = new QueryClient();

const mockFilterQuery = { filter: "" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useSearchParams: () => [new URLSearchParams(mockFilterQuery), jest.fn()],
}));

const renderComponent = (filterQuery?: string) => {
  mockFilterQuery.filter = filterQuery || "";

  return render(
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <JotaiTestProvider initialValues={[[mockFilterState, ""]]}>
            <Filter
              state={mockFilterState}
              label="Test filter label"
              placeholder="Test filter placeholder"
            />
          </JotaiTestProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </RecoilRoot>,
  );
};

describe("Filter", () => {
  it("displays a search input", () => {
    renderComponent();
    expect(screen.getByLabelText(searchInputLabel)).toBeInTheDocument();
  });

  it("displays an empty input if there is no filter query", () => {
    renderComponent();
    expect(screen.getByLabelText(searchInputLabel)).toHaveValue("");
  });

  it("displays an input with the filter query value if it exists", () => {
    renderComponent("policy-name");
    expect(screen.getByLabelText(searchInputLabel)).toHaveValue("policy-name");
  });

  it("clears the filter when the reset button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(screen.getByLabelText(searchInputLabel)).toHaveValue("");
  });
});
