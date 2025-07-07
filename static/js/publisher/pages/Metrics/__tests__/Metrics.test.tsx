import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import * as worldData from "../../../../world-110m.v1.json";
import {
  mockActiveDeviceMetrics,
  mockTerritoryMetrics,
} from "../../../test-utils";

import Metrics from "../Metrics";

Object.defineProperty(global.SVGElement.prototype, "getBBox", {
  writable: true,
  value: jest.fn().mockReturnValue({
    x: 0,
    y: 0,
  }),
});

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    snapId: "test-snap-id",
  }),
}));

const queryClient = new QueryClient();

function renderComponent() {
  render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Metrics />
      </BrowserRouter>
    </QueryClientProvider>,
  );
}

const handlers = [
  http.get("/test-snap-id/metrics/active-device-annotation", () => {
    return HttpResponse.json({
      buckets: [],
      name: "annotations",
      series: [],
    });
  }),
  http.get("/test-snap-id/metrics/active-latest-devices", () => {
    return HttpResponse.json({
      latest_active_devices: 0,
    });
  }),
  http.get("/test-snap-id/metrics/active-devices", () => {
    return HttpResponse.json({
      active_devices: {
        buckets: [],
        name: "weekly_installed_base_by_version",
        series: [],
      },
      latest_archive_devices: 0,
      total_page_num: 1,
    });
  }),
  http.get("/test-snap-id/metrics/country-metric", () => {
    return HttpResponse.json({
      active_devices: {},
      territories_total: 0,
    });
  }),
  http.get("/static/js/world-110m.v1.json", () => {
    return HttpResponse.json(worldData);
  }),
];

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  queryClient.clear();
});

afterAll(() => {
  server.close();
});

describe("Metrics", () => {
  test("shows correct heading", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "My snaps / test-snap-id / Metrics",
      }),
    ).toBeInTheDocument();
  });

  test("highlights correct tab", () => {
    renderComponent();
    expect(screen.getByRole("link", { name: "Metrics" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("shows empty state if no data", async () => {
    renderComponent();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "Measure your snap's performance",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "You'll be able to see active devices and territories when people start using your snap.",
        ),
      ).toBeInTheDocument();
    });
  });

  test("disables filters if no data", async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByLabelText("Period")).toBeDisabled();
      expect(screen.getByLabelText("Category")).toBeDisabled();
    });
  });

  test("enables filters if data", async () => {
    server.use(
      http.get("/test-snap-id/metrics/active-devices", () => {
        return HttpResponse.json(mockActiveDeviceMetrics);
      }),
    );
    server.use(
      http.get("/test-snap-id/metrics/country-metric", () => {
        return HttpResponse.json(mockTerritoryMetrics);
      }),
    );
    renderComponent();
    await waitFor(() => {
      expect(screen.getByLabelText("Period")).not.toBeDisabled();
      expect(screen.getByLabelText("Category")).not.toBeDisabled();
    });
  });

  test("renders active devices graph if data", async () => {
    server.use(
      http.get("/test-snap-id/metrics/active-devices", () => {
        return HttpResponse.json(mockActiveDeviceMetrics);
      }),
    );
    server.use(
      http.get("/test-snap-id/metrics/country-metric", () => {
        return HttpResponse.json(mockTerritoryMetrics);
      }),
    );
    renderComponent();
    await waitFor(() => {
      expect(document.getElementById("activeDevices")).toBeInTheDocument();
    });
  });

  test("renders territories graph if data", async () => {
    server.use(
      http.get("/test-snap-id/metrics/active-devices", () => {
        return HttpResponse.json(mockActiveDeviceMetrics);
      }),
    );
    server.use(
      http.get("/test-snap-id/metrics/country-metric", () => {
        return HttpResponse.json(mockTerritoryMetrics);
      }),
    );
    renderComponent();
    await waitFor(() => {
      expect(document.getElementById("territories")).toBeInTheDocument();
    });
  });
});
