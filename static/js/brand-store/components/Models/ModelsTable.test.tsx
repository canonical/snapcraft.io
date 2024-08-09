import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ModelsTable from "./ModelsTable";

const renderComponent = () => {
  return render(
    <RecoilRoot>
      <BrowserRouter>
        <ModelsTable />
      </BrowserRouter>
    </RecoilRoot>
  );
};

describe("ModelsTable", () => {
  it("renders", () => {
    renderComponent();
    expect(screen.getByTestId("models-table")).toBeInTheDocument();
  });

  it("renders the correct columns", () => {
    renderComponent();

    expect(
      screen.getByRole("columnheader", { name: /Name/ })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "API key" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Policy revision" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Last updated" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Created date" })
    ).toBeInTheDocument();
  });

  it("sorts the 'Name' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", { name: /Name/ });

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

  it("sorts the 'Created date' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", {
      name: "Created date",
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
