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

const serialLogData = [
  {
    "brand-id": "test-brand",
    "created-at": "2023-09-05T11:55:53.732366",
    "model-name": "test-model",
    serial: "test-serial",
  },
];

const handlers = [
  http.get("/api/store/test-brand/models/test-model/serial-log", () => {
    return HttpResponse.json({
      data: serialLogData,
      message: "",
      success: true,
    });
  }),
  http.get("/api/store/test-brand-fail/models/test-model/serial-log", () => {
    return HttpResponse.json({
      data: [],
      message: "There was a problem fetching serial logs",
      success: false,
    });
  }),
  http.get("/api/store/test-brand-error/models/test-model/serial-log", () => {
    return HttpResponse.error();
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

describe("useSerialLogs", () => {
  test("returns serial log data", async () => {
    const { result } = renderHook(
      () => useSerialLogs("test-brand", "test-model"),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(serialLogData);
  });

  test("returns error if request fails", async () => {
    const { result } = renderHook(
      () => useSerialLogs("test-brand-fail", "test-model"),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  test("returns error if network error", async () => {
    const { result } = renderHook(
      () => useSerialLogs("test-brand-error", "test-model"),
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
