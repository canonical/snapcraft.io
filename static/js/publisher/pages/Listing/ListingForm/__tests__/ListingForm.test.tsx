import { QueryClient, QueryClientProvider, useMutation } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import ListingForm from "../ListingForm";
import { mockListingData } from "../../../../test-utils";
import { shouldShowUpdateMetadataWarning } from "../../../../utils";
import { useMutateListingData } from "../../../../hooks";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useParams: () => ({
      snapId: "test_id",
    }),
  };
});

jest.mock("../../../../utils");
jest.mock("../../../../hooks");

function renderComponent(updateMetadataOnRelease = false) {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };
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
      return HttpResponse.json({ success: true }, { status: 200 });
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

  test("notification displayed when update_metadata_on_release", () => {
    renderComponent(true);
    expect(
      screen.getByText("Information here was automatically"),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Learn more" })).toBeVisible();
  });

  test("warning modal displayed on save when update_metadata_on_release", async () => {
    (shouldShowUpdateMetadataWarning as jest.Mock).mockReturnValue(true);
    const mutate = jest.fn();
    (useMutateListingData as jest.Mock).mockReturnValue({
      mutate: mutate,
      isLoading: false,
    });
    renderComponent(true);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.findByRole("modal")).toBeVisible();
    expect(screen.findByRole("heading", { name: "Warning" })).toBeVisible();
    expect(screen.findByText("Making these changes means")).toBeVisible();
    expect(mutate).not.toHaveBeenCalled();
  });

  test("warning modal submits form data on save", async () => {
    (shouldShowUpdateMetadataWarning as jest.Mock).mockReturnValue(true);
    const mutate = jest.fn();
    (useMutateListingData as jest.Mock).mockReturnValue({
      mutate: mutate,
      isLoading: false,
    });
    renderComponent(true);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("button", { name: "Save changes" });
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(
      screen.findByRole("heading", { name: "Warning" }),
    ).not.toBeInTheDocument();
    expect(mutate).toHaveBeenCalled();
  });

  test("show success notification on save", async () => {
    (shouldShowUpdateMetadataWarning as jest.Mock).mockReturnValue(false);
    const mockUseMutateListingData =
      useMutateListingData as jest.MockedFunction<typeof useMutateListingData>;
    mockUseMutateListingData.mockImplementation((options) => {
      options.setShowSuccessNotification(true);
      return useMutation({});
    });
    renderComponent();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.findByText("Changes applied successfully")).toBeVisible();
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
