import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import MetricsInputs from "./MetricsInputs";

const props = {
  register: jest.fn(),
  setValue: jest.fn(),
  listingData: {
    public_metrics_enabled: false,
    public_metrics_blacklist: [],
  },
};

jest.mock("nanoid", () => {
  return { nanoid: () => `abcd-${Math.random() * (999 - 100 + 1) + 100}` };
});

test("public metrics are not enabled", () => {
  render(<MetricsInputs {...props} />);
  expect(
    screen.getByRole("checkbox", { name: "Display public popularity charts" })
  ).not.toBeChecked();
});

test("world map field is disabled", () => {
  render(<MetricsInputs {...props} />);
  expect(screen.getByRole("checkbox", { name: "World map" })).toBeDisabled();
});

test("Linux distros field is disabled", () => {
  render(<MetricsInputs {...props} />);
  expect(
    screen.getByRole("checkbox", { name: "Linux distributions" })
  ).toBeDisabled();
});

test("public metrics are enabled if checked", () => {
  render(
    <MetricsInputs
      {...props}
      listingData={{
        public_metrics_enabled: true,
        public_metrics_blacklist: [],
      }}
    />
  );
  expect(
    screen.getByRole("checkbox", { name: "Display public popularity charts" })
  ).toBeChecked();
});

test("world map field to be enabled if public metrics enabled", () => {
  render(
    <MetricsInputs
      {...props}
      listingData={{
        public_metrics_enabled: true,
        public_metrics_blacklist: [],
      }}
    />
  );
  expect(
    screen.getByRole("checkbox", { name: "World map" })
  ).not.toBeDisabled();
});

test("Linux distros field to be enabled if public metrics enabled", () => {
  render(
    <MetricsInputs
      {...props}
      listingData={{
        public_metrics_enabled: true,
        public_metrics_blacklist: [],
      }}
    />
  );
  expect(
    screen.getByRole("checkbox", { name: "Linux distributions" })
  ).not.toBeDisabled();
});

test("world map field to be checked if value is not in blacklist", () => {
  render(<MetricsInputs {...props} />);
  expect(screen.getByRole("checkbox", { name: "World map" })).toBeChecked();
});

test("world map field not to be checked if value is in blacklist", () => {
  render(
    <MetricsInputs
      {...props}
      listingData={{
        public_metrics_enabled: true,
        public_metrics_blacklist: ["installed_base_by_country_percent"],
      }}
    />
  );
  expect(screen.getByRole("checkbox", { name: "World map" })).not.toBeChecked();
});

test("Linux distributions field to be checked if value is not in blacklist", () => {
  render(<MetricsInputs {...props} />);
  expect(
    screen.getByRole("checkbox", { name: "Linux distributions" })
  ).toBeChecked();
});

test("Linux distributions field not to be checked if value is in blacklist", () => {
  render(
    <MetricsInputs
      {...props}
      listingData={{
        public_metrics_enabled: true,
        public_metrics_blacklist: [
          "weekly_installed_base_by_operating_system_normalized",
        ],
      }}
    />
  );
  expect(
    screen.getByRole("checkbox", { name: "Linux distributions" })
  ).not.toBeChecked();
});
