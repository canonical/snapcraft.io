import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot, useRecoilValue } from "recoil";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ModelsFilter from "./ModelsFilter";
import { modelsListFilterState } from "../../atoms";

const searchInputLabel = "Search models";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const mockFilterQuery = { filter: "" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useSearchParams: () => [new URLSearchParams(mockFilterQuery), jest.fn()],
}));

export const RecoilObserver = ({
  node,
  onChange,
}: {
  node: any;
  onChange: Function;
}) => {
  const value = useRecoilValue(node);
  useEffect(() => onChange(value), [onChange, value]);
  return null;
};

const onChange = jest.fn();

const renderComponent = (filterQuery?: string) => {
  mockFilterQuery.filter = filterQuery || "";

  return render(
    <RecoilRoot>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <RecoilObserver node={modelsListFilterState} onChange={onChange} />
          <ModelsFilter />
        </QueryClientProvider>
      </BrowserRouter>
    </RecoilRoot>
  );
};

describe("ModelsFilter", () => {
  it("displays a search input", () => {
    renderComponent();
    expect(screen.getByLabelText(searchInputLabel)).toBeInTheDocument();
  });

  it("displays an empty input if there is no filter query", () => {
    renderComponent();
    expect(screen.getByLabelText(searchInputLabel)).toHaveValue("");
  });

  it("displays an input with the filter query value if it exists", () => {
    renderComponent("model-name");
    expect(screen.getByLabelText(searchInputLabel)).toHaveValue("model-name");
  });

  it("calls `setFilter` when the search input changes", () => {
    renderComponent();
    fireEvent.change(screen.getByLabelText(searchInputLabel), {
      target: {
        value: "model-name",
      },
    });
    expect(onChange).toHaveBeenCalledWith("model-name");
  });

  it("clears the filter when the reset button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(onChange).toHaveBeenCalledWith("");
    expect(screen.getByLabelText(searchInputLabel)).toHaveValue("");
  });
});
