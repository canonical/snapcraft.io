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

const renderComponent = ({
  isSavingEdit = false,
  editedDescriptions = {},
  onEditChange = vi.fn(),
  onEditSave = vi.fn(async () => {}),
  onEditCancel = vi.fn(),
  remodelsToDelete = [],
  setRemodelsToDelete = vi.fn(),
}: {
  isSavingEdit?: boolean;
  editedDescriptions?: Record<string, string>;
  onEditChange?: (rowId: string, value: string) => void;
  onEditSave?: (remodel: Remodel) => Promise<void>;
  onEditCancel?: (rowId: string) => void;
  remodelsToDelete?: Remodel[];
  setRemodelsToDelete?: (remodels: Remodel[]) => void;
} = {}) => {
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
          isSavingEdit={isSavingEdit}
          editedDescriptions={editedDescriptions}
          onEditChange={onEditChange}
          onEditSave={onEditSave}
          onEditCancel={onEditCancel}
          remodelsToDelete={remodelsToDelete}
          setRemodelsToDelete={setRemodelsToDelete}
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
    renderComponent({
      editedDescriptions: { [firstRowId]: "modified description" },
    });

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revert" })).toBeInTheDocument();
  });

  it("supports multiple rows with pending edits simultaneously", () => {
    renderComponent({
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

    renderComponent({
      editedDescriptions: { [firstRowId]: "modified description" },
      onEditSave,
    });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onEditSave).toHaveBeenCalledWith(remodels[0]);
  });

  it("calls onEditChange when editing note text", async () => {
    const user = userEvent.setup();
    const onEditChange = vi.fn();

    renderComponent({
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

    renderComponent({
      editedDescriptions: { [firstRowId]: "modified description" },
      onEditCancel,
    });

    await user.click(screen.getByRole("button", { name: "Revert" }));

    expect(onEditCancel).toHaveBeenCalledWith(firstRowId);
  });

  it("renders checkboxes for each row", () => {
    renderComponent();

    // Should have checkbox for each remodel row (2) plus header checkbox
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(3);
  });

  it("calls setRemodelsToDelete when individual checkbox is clicked", async () => {
    const user = userEvent.setup();
    const setRemodelsToDelete = vi.fn();

    renderComponent({
      setRemodelsToDelete,
    });

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is the header, second is first row
    await user.click(checkboxes[1]);

    expect(setRemodelsToDelete).toHaveBeenCalledWith([remodels[0]]);
  });

  it("calls setRemodelsToDelete to remove item when checkbox is unchecked", async () => {
    const user = userEvent.setup();
    const setRemodelsToDelete = vi.fn();

    renderComponent({
      remodelsToDelete: [remodels[0]],
      setRemodelsToDelete,
    });

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is the header, second is first row (which is checked)
    await user.click(checkboxes[1]);

    expect(setRemodelsToDelete).toHaveBeenCalledWith([]);
  });

  it("selects all remodels when header checkbox is clicked", async () => {
    const user = userEvent.setup();
    const setRemodelsToDelete = vi.fn();

    renderComponent({
      setRemodelsToDelete,
    });

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is the header
    await user.click(checkboxes[0]);

    expect(setRemodelsToDelete).toHaveBeenCalledWith(remodels);
  });

  it("deselects all remodels when header checkbox is unchecked", async () => {
    const user = userEvent.setup();
    const setRemodelsToDelete = vi.fn();

    renderComponent({
      remodelsToDelete: remodels,
      setRemodelsToDelete,
    });

    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is the header
    await user.click(checkboxes[0]);

    expect(setRemodelsToDelete).toHaveBeenCalledWith([]);
  });

  it("shows header checkbox as checked when all items selected", () => {
    renderComponent({
      remodelsToDelete: remodels,
    });

    const checkboxes = screen.getAllByRole("checkbox");
    // Header checkbox should be checked
    expect(checkboxes[0]).toBeChecked();
  });

  it("shows header checkbox as indeterminate when some items selected", () => {
    renderComponent({
      remodelsToDelete: [remodels[0]],
    });

    const checkboxes = screen.getAllByRole("checkbox");
    // Header checkbox should be indeterminate
    expect(checkboxes[0]).toHaveProperty("indeterminate", true);
  });

  it("shows individual row checkbox as checked when row is selected", () => {
    renderComponent({
      remodelsToDelete: [remodels[0]],
    });

    const checkboxes = screen.getAllByRole("checkbox");
    // Second checkbox (first row) should be checked
    expect(checkboxes[1]).toBeChecked();
    // Third checkbox (second row) should not be checked
    expect(checkboxes[2]).not.toBeChecked();
  });
});
