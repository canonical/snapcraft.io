import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SectionNav from "./SectionNav";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn().mockReturnValue({ id: "test" }),
}));

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function renderComponent(sectionName: string) {
  return render(
    <Router>
      <QueryClientProvider client={queryClient}>
        <SectionNav sectionName={sectionName} />
      </QueryClientProvider>
    </Router>
  );
}

const defaultQueryResponse = {
  data: {
    success: false,
  },
  isLoading: false,
  isSuccess: true,
};

test("active state is set on snaps when on snaps section", async () => {
  // @ts-ignore
  useQuery.mockReturnValue(defaultQueryResponse);
  renderComponent("snaps");
  expect(
    screen.getByRole("tab", { name: "Snaps" }).getAttribute("aria-selected")
  ).toEqual("true");
});

test("active state is set on snaps when on members section", async () => {
  // @ts-ignore
  useQuery.mockReturnValue(defaultQueryResponse);
  renderComponent("members");
  expect(
    screen.getByRole("tab", { name: "Members" }).getAttribute("aria-selected")
  ).toEqual("true");
});

test("active state is set on snaps when on settings section", async () => {
  // @ts-ignore
  useQuery.mockReturnValue(defaultQueryResponse);
  renderComponent("settings");
  expect(
    screen.getByRole("tab", { name: "Settings" }).getAttribute("aria-selected")
  ).toEqual("true");
});

test("active state is set on snaps when on models section", async () => {
  // @ts-ignore
  useQuery.mockReturnValue({
    ...defaultQueryResponse,
    data: { success: true },
  });
  renderComponent("models");
  expect(
    screen.getByRole("tab", { name: "Models" }).getAttribute("aria-selected")
  ).toEqual("true");
});

test("active state is set on snaps when on signing keys section", async () => {
  // @ts-ignore
  useQuery.mockReturnValue({
    ...defaultQueryResponse,
    data: { success: true },
  });
  renderComponent("signing-keys");
  expect(
    screen
      .getByRole("tab", { name: "Signing keys" })
      .getAttribute("aria-selected")
  ).toEqual("true");
});

test("it renders 'Models' and 'Signing keys' in nav if response is successful", async () => {
  // @ts-ignore
  useQuery.mockReturnValue({
    ...defaultQueryResponse,
    data: { success: true },
  });
  renderComponent("models");
  expect(screen.getByRole("tab", { name: "Models" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Signing keys" })).toBeInTheDocument();
});

test("it doesn't render 'Models' and 'Signing keys' in nav if response is not successful", async () => {
  // @ts-ignore
  useQuery.mockReturnValue({
    ...defaultQueryResponse,
    data: { success: false },
  });
  renderComponent("snaps");
  expect(screen.queryByRole("tab", { name: "Models" })).not.toBeInTheDocument();
  expect(
    screen.queryByRole("tab", { name: "Signing keys" })
  ).not.toBeInTheDocument();
});
