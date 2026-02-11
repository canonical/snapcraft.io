import { QueryClient, QueryClientProvider } from "react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import useRemodels from "../useRemodels";

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

const remodelsResponse = {
  allowlist: [
    {
      "created-at": "2023-09-05T11:55:53.732366",
      "created-by": "John Doe",
      description: "Test description",
      "from-model": "test-from-model",
      "from-serial": "test-from-serial",
      "modified-at": null,
      "modified-by": null,
      "to-model": "test-to-model",
    },
  ],
};

const handlers = [
  http.get("/api/store/test-brand-id/models/remodel-allowlist", () => {
    return HttpResponse.json({
      data: remodelsResponse,
      message: "",
      success: true,
    });
  }),
  http.get("/api/store/test-brand-id-fail/models/remodel-allowlist", () => {
    return HttpResponse.json({
      data: [],
      message: "There was a problem fetching remodels",
      success: false,
    });
  }),
  http.get("/api/store/test-brand-id-error/models/remodel-allowlist", () => {
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

describe("useRemodels", () => {
  test("returns remodels data", async () => {
    const { result } = renderHook(() => useRemodels("test-brand-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(remodelsResponse.allowlist);
  });

  test("returns error if request fails", async () => {
    const { result } = renderHook(() => useRemodels("test-brand-id-fail"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  test("returns error if network error", async () => {
    const { result } = renderHook(() => useRemodels("test-brand-id-error"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });
});
