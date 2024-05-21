import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { render, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Packages from "../Packages";

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        categories: [
          { display_name: "Development", name: "development" },
          { display_name: "Social", name: "social" },
        ],
        packages: [],
      }),
  })
) as jest.Mock;

const queryClient = new QueryClient();

const renderComponent = () =>
  render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Packages />
      </QueryClientProvider>
    </BrowserRouter>
  );

describe("Packages", () => {
  test("featured categories are called by deafult", async () => {
    renderComponent();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/beta/store.json?categories=featured"
      );
    });
  });

  test("selected categories are appended to the API call", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByLabelText("Development"));
    await user.type(screen.getByLabelText("Search Snapcraft"), "code");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/beta/store.json?categories=development"
      );
    });
  });

  test("selected categories and search query are appended to the API call", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByLabelText("Development"));
    await user.type(screen.getByLabelText("Search Snapcraft"), "code");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/beta/store.json?categories=development&q=code"
      );
    });
  });

  test("no categories are appended to the API call if none are selected and there is a search query", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.type(screen.getByLabelText("Search Snapcraft"), "code");
    await user.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/beta/store.json?q=code");
    });
  });
});
