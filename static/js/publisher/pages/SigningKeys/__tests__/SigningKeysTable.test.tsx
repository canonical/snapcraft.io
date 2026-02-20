import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import SigningKeysTable from "../SigningKeysTable";

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <SigningKeysTable
        setShowDisableSuccessNotification={vi.fn()}
        enableTableActions={false}
      />
    </BrowserRouter>,
  );
};

describe("SigningKeysTable", () => {
  it("renders", () => {
    renderComponent();
    expect(screen.getByTestId("signing-keys-table")).toBeInTheDocument();
  });

  it("renders the correct columns", () => {
    renderComponent();

    expect(
      screen.getByRole("columnheader", { name: /Name/ }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Policies" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Models" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Created date" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Fingerprint" }),
    ).toBeInTheDocument();
  });

  it("sorts the 'Name' column when clicking the column header", async () => {
    renderComponent();

    const user = userEvent.setup();
    const columnHeader = screen.getByRole("columnheader", { name: /Name/ });
    const columnHeaderBtn = screen.getByRole("button", { name: /Name/ });

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
