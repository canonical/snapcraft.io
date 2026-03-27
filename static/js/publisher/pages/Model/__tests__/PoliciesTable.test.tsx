import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import PoliciesTable from "../PoliciesTable";

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
        <PoliciesTable
          setShowDeletePolicyNotification={vi.fn()}
          setShowDeletePolicyErrorNotification={vi.fn()}
        />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

describe("PoliciesTable", () => {
  it("renders", () => {
    renderComponent();
    expect(screen.getByTestId("policies-table")).toBeInTheDocument();
  });

  it("renders the correct columns", () => {
    renderComponent();

    expect(
      screen.getByRole("columnheader", { name: "Revision" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Signing key" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Creation date" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Last updated" }),
    ).toBeInTheDocument();
  });

  it("sorts the 'Revision' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", { name: "Revision" });
    const columnHeaderBtn = screen.getByRole("button", { name: "Revision" });

    expect(columnHeader.getAttribute("aria-sort")).toBe("none");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("ascending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("descending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("none");
  });

  it("sorts the 'Signing key' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", {
      name: "Signing key",
    });
    const columnHeaderBtn = screen.getByRole("button", { name: "Signing key" });

    expect(columnHeader.getAttribute("aria-sort")).toBe("none");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("ascending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("descending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("none");
  });

  it("sorts the 'Creation date' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", {
      name: "Creation date",
    });
    const columnHeaderBtn = screen.getByRole("button", {
      name: "Creation date",
    });

    expect(columnHeader.getAttribute("aria-sort")).toBe("none");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("ascending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("descending");

    await user.click(columnHeaderBtn);
    expect(columnHeader.getAttribute("aria-sort")).toBe("none");
  });

  it("sorts the 'Last updated' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", {
      name: "Last updated",
    });
    const columnHeaderBtn = screen.getByRole("button", {
      name: "Last updated",
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
