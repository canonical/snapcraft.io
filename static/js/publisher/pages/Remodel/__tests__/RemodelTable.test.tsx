import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import RemodelTable from "../RemodelTable";
import type { Remodel } from "../../../types/shared";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const remodels: Remodel[] = [
  {
    "created-at": "2026-03-27T14:34:23.666Z",
    "created-by": "test-user",
    "from-model": "from-model-a",
    "from-serial": "serial-1",
    "modified-at": null,
    "modified-by": null,
    "to-model": "to-model-a",
    description: "test remodel",
  },
];

const renderComponent = (
  onDeleteRemodel: (remodel: Remodel) => Promise<void> = vi.fn(async () => {}),
  isDeleting = false,
) => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <RemodelTable
          remodels={remodels}
          handlePageForward={vi.fn()}
          handlePageBack={vi.fn()}
          handlePageSizeChange={vi.fn()}
          forwardDisabled={false}
          backDisabled={true}
          pageSize={10}
          isDeleting={isDeleting}
          onDeleteRemodel={onDeleteRemodel}
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

    expect(
      screen.getByRole("columnheader", { name: "Actions" }),
    ).toBeInTheDocument();
  });

  it("opens the delete modal and closes it when cancel is clicked", async () => {
    renderComponent();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText("Delete remodel")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete this remodel/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Delete remodel")).not.toBeInTheDocument();
  });

  it("calls onDeleteRemodel with the selected remodel", async () => {
    const onDeleteRemodel = vi.fn(async () => {});
    renderComponent(onDeleteRemodel);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getAllByRole("button", { name: "Delete" })[1]);

    expect(onDeleteRemodel).toHaveBeenCalledWith(remodels[0]);
  });
});
