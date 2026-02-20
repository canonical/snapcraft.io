import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
        <RemodelTable />
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
      screen.getByRole("columnheader", { name: "Allowed devices" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Created date" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Note" }),
    ).toBeInTheDocument();
  });

  it("sorts the 'Target model' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", {
      name: "Target model",
    });
    const columnHeaderBtn = screen.getByRole("button", {
      name: "Target model",
    });

    expect(columnHeader.getAttribute("aria-sort")).toBe("none");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("ascending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("descending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("none");
  });

  it("sorts the 'Original model' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", {
      name: "Original model",
    });
    const columnHeaderBtn = screen.getByRole("button", {
      name: "Original model",
    });

    expect(columnHeader.getAttribute("aria-sort")).toBe("none");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("ascending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("descending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("none");
  });

  it("sorts the 'Created date' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", {
      name: "Created date",
    });
    const columnHeaderBtn = screen.getByRole("button", {
      name: "Created date",
    });

    expect(columnHeader.getAttribute("aria-sort")).toBe("none");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("ascending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("descending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("none");
  });
});
