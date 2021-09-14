import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SectionNav from "./SectionNav";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn().mockReturnValue({ id: "test" }),
}));

test("active state is set on snaps when on snaps section", () => {
  render(
    <Router>
      <SectionNav sectionName="snaps" />
    </Router>
  );

  expect(screen.getByText("Snaps").getAttribute("aria-selected")).toEqual(
    "true"
  );
});

test("active state is not set on members or settings when on snaps section", () => {
  render(
    <Router>
      <SectionNav sectionName="snaps" />
    </Router>
  );

  expect(screen.getByText("Members").getAttribute("aria-selected")).toEqual(
    "false"
  );

  expect(screen.getByText("Settings").getAttribute("aria-selected")).toEqual(
    "false"
  );
});

test("active state is set on snaps when on members section", () => {
  render(
    <Router>
      <SectionNav sectionName="members" />
    </Router>
  );

  expect(screen.getByText("Members").getAttribute("aria-selected")).toEqual(
    "true"
  );
});

test("active state is not set on snaps or settings when on members section", () => {
  render(
    <Router>
      <SectionNav sectionName="members" />
    </Router>
  );

  expect(screen.getByText("Snaps").getAttribute("aria-selected")).toEqual(
    "false"
  );

  expect(screen.getByText("Settings").getAttribute("aria-selected")).toEqual(
    "false"
  );
});

test("active state is set on snaps when on settings section", () => {
  render(
    <Router>
      <SectionNav sectionName="settings" />
    </Router>
  );

  expect(screen.getByText("Settings").getAttribute("aria-selected")).toEqual(
    "true"
  );
});

test("active state is not set on members or settings when on settings section", () => {
  render(
    <Router>
      <SectionNav sectionName="settings" />
    </Router>
  );

  expect(screen.getByText("Snaps").getAttribute("aria-selected")).toEqual(
    "false"
  );

  expect(screen.getByText("Members").getAttribute("aria-selected")).toEqual(
    "false"
  );
});
