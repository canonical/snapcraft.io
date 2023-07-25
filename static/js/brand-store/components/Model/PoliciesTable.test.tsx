import React from "react";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import PoliciesTable from "./PoliciesTable";

const renderComponent = () => {
  return render(
    <RecoilRoot>
      <BrowserRouter>
        <PoliciesTable />
      </BrowserRouter>
    </RecoilRoot>
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
      screen.getByRole("columnheader", { name: "Revision" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Signing key" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Creation date" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Last updated" })
    ).toBeInTheDocument();
  });

  it("sorts the 'Revision' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", { name: "Revision" });

    expect(columnHeader.getAttribute("aria-sort")).toBe("none");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("ascending");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("descending");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("none");
  });

  it("sorts the 'Signing key' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", {
      name: "Signing key",
    });

    expect(columnHeader.getAttribute("aria-sort")).toBe("none");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("ascending");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("descending");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("none");
  });

  it("sorts the 'Creation date' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", {
      name: "Creation date",
    });

    expect(columnHeader.getAttribute("aria-sort")).toBe("none");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("ascending");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("descending");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("none");
  });

  it("sorts the 'Last updated' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", {
      name: "Last updated",
    });

    expect(columnHeader.getAttribute("aria-sort")).toBe("none");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("ascending");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("descending");

    await user.click(columnHeader);
    expect(columnHeader.getAttribute("aria-sort")).toBe("none");
  });
});
