import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import RemodelTable from "../RemodelTable";

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
        <RemodelTable
          handlePageForward={vi.fn()}
          handlePageBack={vi.fn()}
          handlePageSizeChange={vi.fn()}
          forwardDisabled={false}
          backDisabled={true}
          pageSize={10}
        />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

describe("RemodelTable", () => {
  it("renders", () => {
    renderComponent();
    expect(screen.getByTestId("remodel-table")).toBeInTheDocument();
  });

  it("renders the correct columns", () => {
    renderComponent();

    expect(
      screen.getByRole("columnheader", { name: "Target model" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Original model" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Serial" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Created date" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Note" }),
    ).toBeInTheDocument();
  });
});
