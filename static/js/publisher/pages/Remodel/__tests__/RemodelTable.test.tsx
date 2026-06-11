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
  {
    "created-at": "2026-03-28T14:34:23.666Z",
    "created-by": "test-user",
    "from-model": "from-model-b",
    "from-serial": "serial-2",
    "modified-at": null,
    "modified-by": null,
    "to-model": "to-model-b",
    description: "second remodel",
  },
];

const firstRowId = "from-model-a:to-model-a:serial-1";
const secondRowId = "from-model-b:to-model-b:serial-2";

const renderComponent = (
  onDeleteRemodel: (remodel: Remodel) => Promise<void> = vi.fn(async () => {}),
  {
    isDeleting = false,
    isSavingEdit = false,
    editedDescriptions = {},
    onEditChange = vi.fn(),
    onEditSave = vi.fn(async () => {}),
    onEditCancel = vi.fn(),
  }: {
    isDeleting?: boolean;
    isSavingEdit?: boolean;
    editedDescriptions?: Record<string, string>;
    onEditChange?: (rowId: string, value: string) => void;
    onEditSave?: (remodel: Remodel) => Promise<void>;
    onEditCancel?: (rowId: string) => void;
  } = {},
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
          isSavingEdit={isSavingEdit}
          editedDescriptions={editedDescriptions}
          onDeleteRemodel={onDeleteRemodel}
          onEditChange={onEditChange}
          onEditSave={onEditSave}
          onEditCancel={onEditCancel}
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

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);

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

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(onDeleteRemodel).toHaveBeenCalledWith(remodels[0]);
  });

  it("shows input fields for all descriptions", () => {
    renderComponent();

    const inputs = screen.getAllByRole("textbox");
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue("test remodel");
    expect(inputs[1]).toHaveValue("second remodel");
  });

  it("does not show save/cancel buttons when value is unchanged", () => {
    renderComponent();

    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Revert" }),
    ).not.toBeInTheDocument();
  });

  it("shows save/cancel buttons when value differs from original", () => {
    renderComponent(undefined, {
      editedDescriptions: { [firstRowId]: "modified description" },
    });

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revert" })).toBeInTheDocument();
  });

  it("supports multiple rows with pending edits simultaneously", () => {
    renderComponent(undefined, {
      editedDescriptions: {
        [firstRowId]: "modified first",
        [secondRowId]: "modified second",
      },
    });

    const saveButtons = screen.getAllByRole("button", {
      name: "Save",
    });
    const cancelButtons = screen.getAllByRole("button", {
      name: "Revert",
    });

    expect(saveButtons).toHaveLength(2);
    expect(cancelButtons).toHaveLength(2);
  });

  it("calls onEditSave with active row remodel when save is clicked", async () => {
    const user = userEvent.setup();
    const onEditSave = vi.fn(async () => {});

    renderComponent(undefined, {
      editedDescriptions: { [firstRowId]: "modified description" },
      onEditSave,
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onEditSave).toHaveBeenCalledWith(remodels[0]);
  });

  it("calls onEditChange when editing note text", async () => {
    const user = userEvent.setup();
    const onEditChange = vi.fn();

    renderComponent(undefined, {
      onEditChange,
    });

    const inputs = screen.getAllByRole("textbox");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "updated note");

    expect(onEditChange).toHaveBeenCalled();
  });

  it("calls onEditCancel with rowId when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onEditCancel = vi.fn();

    renderComponent(undefined, {
      editedDescriptions: { [firstRowId]: "modified description" },
      onEditCancel,
    });

    await user.click(screen.getByRole("button", { name: "Revert" }));

    expect(onEditCancel).toHaveBeenCalledWith(firstRowId);
  });

  it("delete buttons are always visible", () => {
    renderComponent();

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    expect(deleteButtons).toHaveLength(2);
  });

  it("disables delete buttons when busy", () => {
    renderComponent(undefined, {
      isDeleting: true,
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    deleteButtons.forEach((button) => {
      expect(button).toHaveAttribute("aria-disabled", "true");
    });
  });
});
