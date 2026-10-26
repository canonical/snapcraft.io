import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ListingForm from "../ListingForm";
import { mockListingData } from "../../../../test-utils";

vi.mock("@canonical/react-ds-global", () => {
  const Button = ({
    anticipation: _anticipation,
    children,
    disabled,
    importance: _importance,
    loading,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    anticipation?: string;
    importance?: string;
    loading?: boolean;
  }) => (
    <button
      aria-disabled={disabled || loading ? "true" : undefined}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );

  const Card = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;

  Card.Content = ({
    children,
    ...props
  }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;

  const Icon = ({
    children: _children,
    icon: _icon,
  }: {
    children?: React.ReactNode;
    icon: string;
  }) => <span aria-hidden="true" />;

  return {
    Button,
    Card,
    Icon,
    withTooltip: (Component: React.ComponentType) => Component,
  };
});

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useParams: () => ({
    snapId: "test_id",
  }),
}));

function renderComponent(
  updateMetadataOnRelease = false,
  listingDataOverrides = {},
) {
  const data = {
    ...mockListingData,
    update_metadata_on_release: updateMetadataOnRelease,
    ...listingDataOverrides,
  };
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ListingForm data={data} refetch={vi.fn()} />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

const server = setupServer();

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  server.use(
    http.post("/api/test_id/listing", () => {
      return HttpResponse.json({ success: true });
    }),
    http.get("/api/test_id/verify", () => {
      return HttpResponse.json({
        primary_domain: true,
        token: "test-dns-verification-token",
      });
    }),
  );
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("ListingForm", () => {
  test("Tour is rendered", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "Start tour" })).toBeVisible();
  });

  test("Save and Revert buttons reflect form dirty state", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent();
    });

    const titleInput = screen.getByRole("textbox", {
      name: "Title: required",
    });
    const saveButton = screen.getByRole("button", { name: "Save" });
    const revertButton = screen.getByRole("button", { name: "Revert" });

    expect(saveButton).toHaveAttribute("aria-disabled", "true");
    expect(revertButton).toHaveAttribute("aria-disabled", "true");

    await user.type(titleInput, " edited");

    await waitFor(() => {
      expect(saveButton).not.toHaveAttribute("aria-disabled", "true");
      expect(revertButton).not.toHaveAttribute("aria-disabled", "true");
    });

    await user.clear(titleInput);
    await user.type(titleInput, "test-snap");

    await waitFor(() => {
      expect(saveButton).toHaveAttribute("aria-disabled", "true");
      expect(revertButton).toHaveAttribute("aria-disabled", "true");
    });

    await user.type(titleInput, " edited");
    await user.click(revertButton);

    await waitFor(() => {
      expect(titleInput).toHaveValue("test-snap");
      expect(saveButton).toHaveAttribute("aria-disabled", "true");
      expect(revertButton).toHaveAttribute("aria-disabled", "true");
    });
  });

  test("Save and Revert buttons are enabled after changing additional information again", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent();
    });

    const metricsCheckbox = screen.getByRole("checkbox", {
      name: "Display public popularity charts",
    });
    const saveButton = screen.getByRole("button", { name: "Save" });
    const revertButton = screen.getByRole("button", { name: "Revert" });

    await user.click(metricsCheckbox);

    await waitFor(() => {
      expect(saveButton).not.toHaveAttribute("aria-disabled", "true");
      expect(revertButton).not.toHaveAttribute("aria-disabled", "true");
    });

    await user.click(revertButton);

    await waitFor(() => {
      expect(metricsCheckbox).not.toBeChecked();
      expect(saveButton).toHaveAttribute("aria-disabled", "true");
      expect(revertButton).toHaveAttribute("aria-disabled", "true");
    });

    await user.click(metricsCheckbox);

    await waitFor(() => {
      expect(metricsCheckbox).toBeChecked();
      expect(saveButton).not.toHaveAttribute("aria-disabled", "true");
      expect(revertButton).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  test("Save and Revert buttons are enabled after unchecking enabled public metrics again", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent(false, {
        public_metrics_blacklist: [],
        public_metrics_enabled: true,
      });
    });

    const metricsCheckbox = screen.getByRole("checkbox", {
      name: "Display public popularity charts",
    });
    const saveButton = screen.getByRole("button", { name: "Save" });
    const revertButton = screen.getByRole("button", { name: "Revert" });

    expect(metricsCheckbox).toBeChecked();

    await user.click(metricsCheckbox);

    await waitFor(() => {
      expect(saveButton).not.toHaveAttribute("aria-disabled", "true");
      expect(revertButton).not.toHaveAttribute("aria-disabled", "true");
    });

    await user.click(revertButton);

    await waitFor(() => {
      expect(metricsCheckbox).toBeChecked();
      expect(saveButton).toHaveAttribute("aria-disabled", "true");
      expect(revertButton).toHaveAttribute("aria-disabled", "true");
    });

    await user.click(metricsCheckbox);

    await waitFor(() => {
      expect(metricsCheckbox).not.toBeChecked();
      expect(saveButton).not.toHaveAttribute("aria-disabled", "true");
      expect(revertButton).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  test("Save and Revert buttons are enabled after changing nested metrics again", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent();
    });

    const metricsCheckbox = screen.getByRole("checkbox", {
      name: "Display public popularity charts",
    });
    const worldMapCheckbox = screen.getByRole("checkbox", {
      name: "World map",
    });
    const saveButton = screen.getByRole("button", { name: "Save" });
    const revertButton = screen.getByRole("button", { name: "Revert" });

    await user.click(metricsCheckbox);
    await user.click(worldMapCheckbox);
    await user.click(revertButton);

    await waitFor(() => {
      expect(metricsCheckbox).not.toBeChecked();
      expect(saveButton).toHaveAttribute("aria-disabled", "true");
      expect(revertButton).toHaveAttribute("aria-disabled", "true");
    });

    await user.click(metricsCheckbox);
    await user.click(worldMapCheckbox);

    await waitFor(() => {
      expect(saveButton).not.toHaveAttribute("aria-disabled", "true");
      expect(revertButton).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  test("Save and Revert buttons are enabled after changing license again", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent();
    });

    const saveButton = screen.getByRole("button", { name: "Save" });
    const revertButton = screen.getByRole("button", { name: "Revert" });

    await user.click(screen.getByRole("button", { name: "Remove license" }));

    await waitFor(() => {
      expect(saveButton).not.toHaveAttribute("aria-disabled", "true");
      expect(revertButton).not.toHaveAttribute("aria-disabled", "true");
    });

    await user.click(revertButton);

    await waitFor(() => {
      expect(screen.getByText("testing-license")).toBeVisible();
      expect(saveButton).toHaveAttribute("aria-disabled", "true");
      expect(revertButton).toHaveAttribute("aria-disabled", "true");
    });

    await user.click(screen.getByRole("button", { name: "Remove license" }));

    await waitFor(() => {
      expect(saveButton).not.toHaveAttribute("aria-disabled", "true");
      expect(revertButton).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  test("Save and Revert buttons are enabled after changing license type again", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent();
    });

    const saveButton = screen.getByRole("button", { name: "Save" });
    const revertButton = screen.getByRole("button", { name: "Revert" });

    await user.click(screen.getByLabelText("Custom SPDX expression"));

    await waitFor(() => {
      expect(saveButton).not.toHaveAttribute("aria-disabled", "true");
      expect(revertButton).not.toHaveAttribute("aria-disabled", "true");
    });

    await user.click(revertButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Simple")).toBeChecked();
      expect(saveButton).toHaveAttribute("aria-disabled", "true");
      expect(revertButton).toHaveAttribute("aria-disabled", "true");
    });

    await user.click(screen.getByLabelText("Custom SPDX expression"));

    await waitFor(() => {
      expect(screen.getByLabelText("Custom SPDX expression")).toBeChecked();
      expect(saveButton).not.toHaveAttribute("aria-disabled", "true");
      expect(revertButton).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  test("Notification displayed when update_metadata_on_release", () => {
    renderComponent(true);
    expect(
      screen.getByText(/Information here was automatically/),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Learn more" })).toBeVisible();
  });

  test("Success notification displayed after Save", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent(false);
    });

    // perform some random change
    await user.type(
      screen.getByRole("textbox", { name: "Title: required" }),
      "new-title",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Changes applied successfully.")).toBeVisible();
    });
  });

  test("Save and Revert buttons are disabled after successful save", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent(false);
    });

    const titleInput = screen.getByRole("textbox", {
      name: "Title: required",
    });
    const saveButton = screen.getByRole("button", { name: "Save" });
    const revertButton = screen.getByRole("button", { name: "Revert" });

    await user.type(titleInput, " edited");

    await waitFor(() => {
      expect(saveButton).not.toHaveAttribute("aria-disabled", "true");
      expect(revertButton).not.toHaveAttribute("aria-disabled", "true");
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Changes applied successfully.")).toBeVisible();
    });

    await waitFor(() => {
      expect(saveButton).toHaveAttribute("aria-disabled", "true");
      expect(revertButton).toHaveAttribute("aria-disabled", "true");
    });
  });

  test("Failure notification displayed after Save", async () => {
    server.use(
      http.post("/api/test_id/listing", () => {
        return HttpResponse.json({
          success: true,
          errors: [
            {
              code: "media-invalid-aspect-ratio",
              message: "Invalid aspect ratio",
            },
          ],
        });
      }),
    );

    const user = userEvent.setup();
    await act(async () => {
      renderComponent(false);
    });

    // perform some random change
    await user.type(
      screen.getByRole("textbox", { name: "Title: required" }),
      "new-title",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid aspect ratio")).toBeVisible();
    });
  });

  test("ListingDetails is rendered", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { name: "Listing details" }),
    ).toBeVisible();
  });

  test("ContactInformation is rendered", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { name: "Contact information" }),
    ).toBeVisible();
  });

  test("AdditionalInformation is rendered", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", { name: "Additional information" }),
    ).toBeVisible();
  });

  test("PreviewForm is rendered", () => {
    renderComponent();
    expect(document.getElementById("preview-form")).toBeVisible();
  });

  test("Validation error displayed for empty title field", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent();
    });

    // Clear the title field
    const titleInput = screen.getByDisplayValue("test-snap");
    await user.clear(titleInput);

    // Try to submit the form
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Check that validation error is displayed
    await waitFor(() => {
      expect(screen.getByText("This field is required")).toBeVisible();
      expect(screen.getByRole("alert")).toBeVisible();
    });
  });

  test("Validation error displayed for empty summary field", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent();
    });

    // Clear the summary field
    const summaryInput = screen.getByDisplayValue("lorem ispum");
    await user.clear(summaryInput);

    // Try to submit the form
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Check that validation error is displayed
    await waitFor(() => {
      expect(screen.getByText("This field is required")).toBeVisible();
    });
  });

  test("Validation error displayed for empty description field", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent();
    });

    // Clear the description field
    const descriptionInput = screen.getByDisplayValue(
      "lorem ipsum dolor sit amet",
    );
    await user.clear(descriptionInput);

    // Try to submit the form
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Check that validation error is displayed
    await waitFor(() => {
      expect(screen.getByText("This field is required")).toBeVisible();
    });
  });

  test("Validation error displayed for empty category field", async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderComponent();
    });

    // Select empty option in primary category field
    const categorySelect = screen.getByRole("combobox", {
      name: "Category: required",
    });
    await user.selectOptions(categorySelect, "");

    // Try to submit the form
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Check that validation error is displayed
    await waitFor(() => {
      expect(screen.getByText("This field is required")).toBeVisible();
    });
  });

  test("Required field indicators are displayed", () => {
    renderComponent();

    // Check that required asterisks are present (there should be multiple)
    expect(screen.getAllByLabelText("required")).toHaveLength(5);
  });
});
