import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import SerialLogTable from "../SerialLogTable";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SerialLogTable />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

describe("SerialLogTable", () => {
  it("renders", () => {
    renderComponent();
    expect(screen.getByTestId("serial-log-table")).toBeInTheDocument();
  });

  it("renders the correct columns", () => {
    renderComponent();

    expect(
      screen.getByRole("columnheader", { name: "Brand" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Model" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Serial" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Created date" }),
    ).toBeInTheDocument();
  });
});
