import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { render, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import Packages from "../Packages";

import { testCategories } from "../../../mocks";

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        categories: testCategories,
        packages: [],
      }),
  })
) as jest.Mock;

const queryClient = new QueryClient();

const renderComponent = () => {
  render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Packages />
      </QueryClientProvider>
    </BrowserRouter>
  );
};

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

  test("filters are not expanded if there are no selected categories", async () => {
    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Show more/ })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Show less/ })
      ).not.toBeInTheDocument();
    });
  });

  test("filters are expanded if 'Show more' button is clicked", async () => {
    const user = userEvent.setup();
    renderComponent();
    user.click(screen.getByRole("button", { name: /Show more/ }));
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /Show more/ })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Show less/ })
      ).toBeInTheDocument();
    });
  });
});
