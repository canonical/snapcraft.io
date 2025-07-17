import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Listing from "../../Listing";
import { mockListingData } from "../../../../test-utils";

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useParams: () => ({
      snapId: "test_id",
    }),
  };
});

const testListingData = {
  message: "",
  success: true,
  data: mockListingData,
};

function renderComponent() {
  const queryClient = new QueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Listing />
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
    http.get("/api/test_id/listing", () => {
      return HttpResponse.json(testListingData);
    }),
    http.post("/api/test_id/listing", () => {
      return HttpResponse.json({ success: true }, { status: 200 });
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

const expectedListingData = {
  categories: [
    { name: "Test select", slug: "test-select" },
    { name: "Test select secondary", slug: "test-select-secondary" },
  ],
  links: {
    website: ["https://www.modified.com", "https://example.com"],
    contact: ["https://example.com/contact"],
    donations: ["https://example.com/donate"],
    source: ["https://example.com/code"],
    issues: ["https://example.com/issues"],
  },
  snap_name: "test_id",
  title: "title modified",
  images: [
    {
      url: ["https://example.com/screenshot"],
      type: "banner",
      status: "uploaded",
    },
    { url: "", type: "icon", status: "uploaded" },
    {
      url: "https://example.com/screenshot",
      type: "screenshot",
      status: "uploaded",
    },
  ],
  summary: "summary modified",
  description: "description modified",
  video: [
    { type: "video", status: "uploaded", url: "https://example.com/video" },
  ],
  license: "testing-license",
};

describe("PreviewForm", () => {
  test("PreviewForm status matches ListingForm data", async () => {
    const user = userEvent.setup();
    renderComponent();
    const stateInput = (await screen.findByTestId(
      "state-input",
    )) as HTMLInputElement;

    const title = screen.getByLabelText(/Title/);
    const summary = screen.getByLabelText(/Summary/);
    const description = screen.getByLabelText(/Description/);
    const category = screen.getByLabelText(/Category/);
    const secondaryCategory = screen.getByLabelText(/Secondary category/);
    const primaryWebsite = screen.getByLabelText(/Primary website/);
    const iconDeleteButton = screen.getByRole("button", {
      name: "Remove icon",
    });

    // change all the properties
    await user.clear(title);
    await user.type(title, "title modified");
    await user.clear(summary);
    await user.type(summary, "summary modified");
    await user.clear(description);
    await user.type(description, "description modified");
    await user.clear(primaryWebsite);
    await user.type(primaryWebsite, "https://www.modified.com");

    await user.selectOptions(category, "test-select");
    await user.selectOptions(secondaryCategory, "test-select-secondary");
    await user.click(iconDeleteButton);

    expect(stateInput.value).toEqual(JSON.stringify(expectedListingData));
  }, 10000);
});
