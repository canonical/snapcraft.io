import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Listing from "../Listing";

const testListingData = {
  message: "",
  success: true,
  data: {
    banner_urls: [],
    categories: [
      { name: "Art and design", slug: "art-and-design" },
      { name: "Books and Reference", slug: "books-and-reference" },
      { name: "Development", slug: "development" },
      { name: "Devices and IoT", slug: "devices-and-iot" },
      { name: "Education", slug: "education" },
    ],
    contacts: [
      { url: "https://example.com/contact" },
      { url: "mailto:john.doe@example.com" },
    ],
    description: "Test snap description",
    donations: [{ url: "https://example.com/donations" }],
    icon_url: "https://placehold.co/512x512",
    issues: [{ url: "https://example.com/issues" }],
    license: "ANTLR-PD-fallback",
    license_type: "simple",
    licenses: [
      { key: "AFL-2.0", name: "Academic Free License v2.0" },
      { key: "AAL", name: "Attribution Assurance License" },
      {
        key: "ANTLR-PD-fallback",
        name: "ANTLR Software Rights Notice with license fallback",
      },
    ],
    primary_category: "art-and-design",
    primary_website: "https://example.com",
    public_metrics_blacklist: ["installed_base_by_country_percent"],
    public_metrics_enabled: true,
    screenshot_urls: [],
    secondary_category: "books-and-reference",
    snap_id: "test-snap-id",
    source_code: [{ url: "https://example.com/source-code" }],
    summary: "Test snap summary",
    title: "Test snap title",
  },
};

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useParams: () => ({
      snapId: "test-snap-id",
    }),
  };
});

const queryClient = new QueryClient();

function renderComponent() {
  window.SNAP_LISTING_DATA = {
    DNS_VERIFICATION_TOKEN: "test-dns-verification-token",
  };

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
    http.get("/api/test-snap-id/listing", () => {
      return HttpResponse.json(testListingData);
    }),
  );
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("Listing", () => {
  test("revert button disabled by default", () => {
    renderComponent();

    waitFor(() => {
      expect(screen.getByRole("button", { name: "Revert" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });

  test("revert button enabled if changes made", () => {
    const user = userEvent.setup();

    renderComponent();

    waitFor(() => {
      user.type(screen.getByLabelText("Title:"), "edit");
      expect(
        screen.getByRole("button", { name: "Revert" }),
      ).not.toHaveAttribute("aria-disabled", "true");
    });
  });

  test("save button disabled by default", () => {
    server.use(
      http.get("/api/test-snap-id/listing", () => {
        return HttpResponse.json(testListingData);
      }),
    );

    renderComponent();

    waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });

  test("save button enabled if changes made", () => {
    const user = userEvent.setup();

    renderComponent();

    waitFor(() => {
      user.type(screen.getByLabelText("Title:"), "edit");
      expect(screen.getByRole("button", { name: "Save" })).not.toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });
  });

  test("icon is displayed on page", () => {
    renderComponent();

    waitFor(() => {
      expect(screen.getByAltText("test-snap-id icon")).toBeInTheDocument();
    });
  });

  test("icon can be removed", () => {
    const user = userEvent.setup();

    renderComponent();

    waitFor(async () => {
      await user.click(screen.getByRole("button", { name: "Remove icon" }));
      expect(
        screen.queryByAltText("test-snap-id icon"),
      ).not.toBeInTheDocument();
    });
  });

  test("icon image restrictions toggle works", () => {
    const user = userEvent.setup();

    renderComponent();

    waitFor(async () => {
      await user.click(
        screen.getByRole("button", {
          name: "Show image restrictions for icon",
        }),
      );

      expect(
        screen.queryByRole("button", {
          name: "Show image restrictions for icon",
        }),
      ).not.toBeInTheDocument();

      expect(
        screen.getByRole("button", {
          name: "Hide image restrictions for icon",
        }),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", {
          name: "Hide image restrictions for icon",
        }),
      );

      expect(
        screen.queryByRole("button", {
          name: "Hide image restrictions for icon",
        }),
      ).not.toBeInTheDocument();

      expect(
        screen.getByRole("button", {
          name: "Show image restrictions for icon",
        }),
      ).toBeInTheDocument();
    });
  });

  test("secondary category renders correct data", () => {
    renderComponent();

    waitFor(() => {
      expect(screen.getByLabelText("Secondary category:")).toHaveValue(
        testListingData.data.secondary_category,
      );
    });
  });

  test("secondary category can be removed", () => {
    renderComponent();

    waitFor(async () => {
      const user = userEvent.setup();

      renderComponent();

      await user.click(
        screen.getByRole("button", { name: "Remove secondary category" }),
      );

      expect(
        screen.queryByLabelText("Secondary category:"),
      ).not.toBeInTheDocument();
    });
  });

  test("primary website renders correct data", () => {
    renderComponent();

    waitFor(async () => {
      expect(screen.getByLabelText("Primary website:")).toHaveValue(
        testListingData.data.primary_website,
      );
    });
  });

  test("primary website is verified", () => {
    server.use(
      http.get("/api/test-snap-id/verify", () => {
        return HttpResponse.json({ primary_domain: true });
      }),
    );

    renderComponent();

    waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Verified domain" }),
      ).toBeInTheDocument();
    });
  });

  test("primary website is not verified", () => {
    server.use(
      http.get("/api/test-snap-id/verify", () => {
        return HttpResponse.json({ primary_domain: false });
      }),
    );

    renderComponent();

    waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Verify domain" }),
      ).toBeInTheDocument();
    });
  });
});
