import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { render, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Packages from "../Packages";

global.fetch = jest.fn(() => {
  return Promise.resolve({
    json: () => {
      return Promise.resolve({
        total_items: 100,
        total_pages: 10,
        categories: [
          {
            display_name: "Art and Design",
            name: "art-and-design",
          },
          {
            display_name: "Books and Reference",
            name: "books-and-reference",
          },
          {
            display_name: "Development",
            name: "development",
          },
          {
            display_name: "Devices and IoT",
            name: "devices-and-iot",
          },
          {
            display_name: "Education",
            name: "education",
          },
          {
            display_name: "Entertainment",
            name: "entertainment",
          },
          {
            display_name: "Finance",
            name: "finance",
          },
          {
            display_name: "Games",
            name: "games",
          },
          {
            display_name: "Health and Fitness",
            name: "health-and-fitness",
          },
          {
            display_name: "Music and Audio",
            name: "music-and-audio",
          },
          {
            display_name: "News and Weather",
            name: "news-and-weather",
          },
          {
            display_name: "Personalisation",
            name: "personalisation",
          },
          {
            display_name: "Photo and Video",
            name: "photo-and-video",
          },
          {
            display_name: "Productivity",
            name: "productivity",
          },
          {
            display_name: "Science",
            name: "science",
          },
          {
            display_name: "Security",
            name: "security",
          },
          {
            display_name: "Server and Cloud",
            name: "server-and-cloud",
          },
          {
            display_name: "Social",
            name: "social",
          },
          {
            display_name: "Utilities",
            name: "utilities",
          },
        ],
        packages: [
          {
            package: {
              description: "This is a test package",
              display_name: "Test package",
              name: "test-package",
            },
            categories: [
              {
                featured: false,
                name: "development",
              },
            ],
          },
        ],
      });
    },
  });
}) as jest.Mock;

// Required because of the Banner component which uses this
window.HTMLElement.prototype.scrollIntoView = jest.fn();

const queryClient = new QueryClient();

const renderComponent = (
  useMemoryRouter?: boolean,
  initialEntries?: Array<string>,
) => {
  if (useMemoryRouter && initialEntries) {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <QueryClientProvider client={queryClient}>
          <Packages />
        </QueryClientProvider>
      </MemoryRouter>,
    );
  }

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Packages />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

describe("Packages", () => {
  test("featured categories are called by default", async () => {
    renderComponent();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/store.json?categories=featured&page=1"
      );
    });
  });

  test("selected categories are appended to the API call", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByLabelText("Development"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/store.json?categories=development&page=1"
      );
    });
  });

  test("selected categories and search query are appended to the API call", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(screen.getByLabelText("Search Snapcraft"), "code");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await user.click(screen.getByLabelText("Development"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/store.json?categories=development&q=code&page=1"
      );
    });
  });

  test("no categories are appended to the API call if none are selected and there is a search query", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(screen.getByLabelText("Search Snapcraft"), "code");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/store.json?q=code&page=1");
    });
  });

  test("filters are not expanded if there are no selected categories", async () => {
    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Show more/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Show less/ }),
      ).not.toBeInTheDocument();
    });
  });

  test("filters are expanded if 'Show more' button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("button", { name: /Show more/ }));
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /Show more/ }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Show less/ }),
      ).toBeInTheDocument();
    });
  });

  test("reset button should clear the search field", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(screen.getByLabelText("Search Snapcraft"), "code");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Search Snapcraft")).toHaveValue("");
    });
  });

  test("shows all categories if selected categories are not visible", async () => {
    renderComponent(true, ["?categories=science"]);
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Show more" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Show less" }),
      ).toBeInTheDocument();
    });
  });

  test("shows correct title if two categories are selected", async () => {
    renderComponent(true, ["?categories=development%2Cscience"]);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Development and 1 more category",
        }),
      ).toBeInTheDocument();
    });
  });

  test("shows correct title if several categories are selected", async () => {
    renderComponent(true, [
      "?categories=development,science,utilities,education,finance",
    ]);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Development and 4 more categories",
        }),
      ).toBeInTheDocument();
    });
  });

  test("removes featured category when another category is selected", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByLabelText("Development"));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/store.json?categories=development&page=1"
      );
    });
  });
});
