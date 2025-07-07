import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ListingForm from "../ListingForm";
import { mockListingData } from "../../../../test-utils";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useParams: () => ({
      snapId: "test_id",
    }),
  };
});

function renderComponent(updateMetadataOnRelease = false) {
  const data = {
    ...mockListingData,
    update_metadata_on_release: updateMetadataOnRelease,
  };
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ListingForm data={data} refetch={jest.fn()} />
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
      screen.getByRole("textbox", { name: "Title:" }),
      "new-title",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Changes applied successfully.")).toBeVisible();
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
      screen.getByRole("textbox", { name: "Title:" }),
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
});
