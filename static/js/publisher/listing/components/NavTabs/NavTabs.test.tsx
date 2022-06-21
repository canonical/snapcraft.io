import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import NavTabs from "./NavTabs";

const snapName = "test-snap-name";

test("the 'Listing' tab has the correct path", () => {
  render(<NavTabs snapName={snapName} />);
  expect(
    screen.getByRole("tab", { name: "Listing" }).getAttribute("href")
  ).toBe(`/${snapName}/listing`);
});

test("the 'Builds' tab has the correct path", () => {
  render(<NavTabs snapName={snapName} />);
  expect(screen.getByRole("tab", { name: "Builds" }).getAttribute("href")).toBe(
    `/${snapName}/builds`
  );
});

test("the 'Releases' tab has the correct path", () => {
  render(<NavTabs snapName={snapName} />);
  expect(
    screen.getByRole("tab", { name: "Releases" }).getAttribute("href")
  ).toBe(`/${snapName}/releases`);
});

test("the 'Metrics' tab has the correct path", () => {
  render(<NavTabs snapName={snapName} />);
  expect(
    screen.getByRole("tab", { name: "Metrics" }).getAttribute("href")
  ).toBe(`/${snapName}/metrics`);
});

test("the 'Publicise' tab has the correct path", () => {
  render(<NavTabs snapName={snapName} />);
  expect(
    screen.getByRole("tab", { name: "Publicise" }).getAttribute("href")
  ).toBe(`/${snapName}/publicise`);
});

test("the 'Settings' tab has the correct path", () => {
  render(<NavTabs snapName={snapName} />);
  expect(
    screen.getByRole("tab", { name: "Settings" }).getAttribute("href")
  ).toBe(`/${snapName}/settings`);
});
