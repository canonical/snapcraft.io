import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import SectionNav from "./SectionNav";

const snapName = "test-snap-name";

const props = {
  snapName: "test-snap-name",
  activeTab: "listing",
};

test("the page displays the correct name for the snap", () => {
  render(<SectionNav {...props} />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "test-snap-name"
  );
});

test("the 'Listing' tab has the correct path", () => {
  render(<SectionNav {...props} />);
  expect(
    screen.getByRole("link", { name: "Listing" }).getAttribute("href")
  ).toBe(`/${snapName}/listing`);
});

test("the 'Builds' tab has the correct path", () => {
  render(<SectionNav {...props} />);
  expect(
    screen.getByRole("link", { name: "Builds" }).getAttribute("href")
  ).toBe(`/${snapName}/builds`);
});

test("the 'Releases' tab has the correct path", () => {
  render(<SectionNav {...props} />);
  expect(
    screen.getByRole("link", { name: "Releases" }).getAttribute("href")
  ).toBe(`/${snapName}/releases`);
});

test("the 'Metrics' tab has the correct path", () => {
  render(<SectionNav {...props} />);
  expect(
    screen.getByRole("link", { name: "Metrics" }).getAttribute("href")
  ).toBe(`/${snapName}/metrics`);
});

test("the 'Publicise' tab has the correct path", () => {
  render(<SectionNav {...props} />);
  expect(
    screen.getByRole("link", { name: "Publicise" }).getAttribute("href")
  ).toBe(`/${snapName}/publicise`);
});

test("the 'Settings' tab has the correct path", () => {
  render(<SectionNav {...props} />);
  expect(
    screen.getByRole("link", { name: "Settings" }).getAttribute("href")
  ).toBe(`/${snapName}/settings`);
});
