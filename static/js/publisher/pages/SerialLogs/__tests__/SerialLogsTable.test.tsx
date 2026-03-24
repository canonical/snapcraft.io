import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import SerialLogsTable from "../SerialLogsTable";

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
        <SerialLogsTable />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

describe("SerialLogsTable", () => {
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
      screen.getByRole("columnheader", { name: "Serial number" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Date" }),
    ).toBeInTheDocument();
  });
});
