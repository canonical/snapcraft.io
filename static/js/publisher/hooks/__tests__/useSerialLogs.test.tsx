import { QueryClient, QueryClientProvider } from "react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import useSerialLogs from "../useSerialLogs";

import type { ReactNode } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const serialLogsResponse = {
  items: [
    {
      "brand-id": "test-brand-id",
      "created-at": "2023-09-05T11:55:53.732366",
      "model-name": "test-model",
      serial: "test-serial",
      "serial-assertion": "test-assertion",
      "serial-sign-key-sha3-384": "test-sha3",
    },
  ],
  "next-cursor": null,
};

const handlers = [
  http.get("/api/store/test-brand-id/models/test-model/serial-log", () => {
    return HttpResponse.json({
      data: serialLogsResponse,
      success: true,
    });
  }),
  http.get("/api/store/test-brand-id-fail/models/test-model/serial-log", () => {
    return HttpResponse.json({
      message: "There was a problem fetching serial logs",
      success: false,
    });
  }),
  http.get(
    "/api/store/test-brand-id-error/models/test-model/serial-log",
    () => {
      return HttpResponse.error();
    },
  ),
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

describe("useSerialLogs", () => {
  test("returns serial logs data", async () => {
    const { result } = renderHook(
      () => useSerialLogs("test-brand-id", "test-model"),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      data: serialLogsResponse,
      success: true,
    });
  });

  test("returns serial logs data with pageSize param", async () => {
    server.use(
      http.get(
        "/api/store/test-brand-id/models/test-model/serial-log",
        ({ request }) => {
          const url = new URL(request.url);

          expect(url.searchParams.get("page-size")).toBe("10");
          return HttpResponse.json({
            data: serialLogsResponse,
            success: true,
          });
        },
      ),
    );

    const { result } = renderHook(
      () =>
        useSerialLogs("test-brand-id", "test-model", {
          pageSize: 10,
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      data: serialLogsResponse,
      success: true,
    });
  });

  test("returns serial logs data with startTime and endTime params", async () => {
    server.use(
      http.get(
        "/api/store/test-brand-id/models/test-model/serial-log",
        ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("start-time")).toBe(
            "2026-03-24T04:00:23.875000",
          );
          expect(url.searchParams.get("end-time")).toBe(
            "2026-03-28T04:00:23.875000",
          );
          return HttpResponse.json({
            data: serialLogsResponse,
            success: true,
          });
        },
      ),
    );

    const { result } = renderHook(
      () =>
        useSerialLogs("test-brand-id", "test-model", {
          interval: {
            startTime: "2026-03-24T04:00:23.875000",
            endTime: "2026-03-28T04:00:23.875000",
          },
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      data: serialLogsResponse,
      success: true,
    });
  });

  test("returns serial logs data with page param", async () => {
    server.use(
      http.get(
        "/api/store/test-brand-id/models/test-model/serial-log",
        ({ request }) => {
          const url = new URL(request.url);

          expect(url.searchParams.get("page")).toBe("pagecursor");
          return HttpResponse.json({
            data: serialLogsResponse,
            success: true,
          });
        },
      ),
    );

    const { result } = renderHook(
      () =>
        useSerialLogs("test-brand-id", "test-model", {
          page: "pagecursor",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      data: serialLogsResponse,
      success: true,
    });
  });

  test("returns serial logs data with startTime, endTime, pageSize and page params", async () => {
    server.use(
      http.get(
        "/api/store/test-brand-id/models/test-model/serial-log",
        ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get("start-time")).toBe(
            "2026-03-24T04:00:23.875000",
          );
          expect(url.searchParams.get("end-time")).toBe(
            "2026-03-28T04:00:23.875000",
          );
          expect(url.searchParams.get("page-size")).toBe("10");
          expect(url.searchParams.get("page")).toBe("pagecursor");
          return HttpResponse.json({
            data: serialLogsResponse,
            success: true,
          });
        },
      ),
    );

    const { result } = renderHook(
      () =>
        useSerialLogs("test-brand-id", "test-model", {
          interval: {
            startTime: "2026-03-24T04:00:23.875000",
            endTime: "2026-03-28T04:00:23.875000",
          },
          pageSize: 10,
          page: "pagecursor",
        }),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      data: serialLogsResponse,
      success: true,
    });
  });

  test("returns error if request fails", async () => {
    const { result } = renderHook(
      () => useSerialLogs("test-brand-id-fail", "test-model"),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      message: "There was a problem fetching serial logs",
      success: false,
    });
  });

  test("returns error if network error", async () => {
    const { result } = renderHook(
      () => useSerialLogs("test-brand-id-error", "test-model"),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });
});
