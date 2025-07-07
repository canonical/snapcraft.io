import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { renderHook, waitFor } from "@testing-library/react";

import useValidationSet from "../useValidationSet";

import type { ReactNode } from "react";

const queryClient = new QueryClient();

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const validationSetResponse = [
  {
    "account-id": "test-account-id",
    "authority-id": "test-authority-id",
    name: "test-name",
    sequence: "1",
    series: "16",
    "sign-key-sha3-384": "test-sign-key",
    snaps: [
      {
        id: "test-snap-id",
        name: "test-snap-name",
      },
    ],
    timestamp: "2024-08-13T09:40:10Z",
    type: "validation-set",
  },
];

const handlers = [
  http.get("/api/validation-sets/test-id-success", () => {
    return HttpResponse.json({
      data: validationSetResponse,
      message: "",
      success: true,
    });
  }),
  http.get("/api/validation-sets/test-id-fail", () => {
    return HttpResponse.json({
      data: [],
      message: "Unable to fetch validation set",
      success: false,
    });
  }),
  http.get("/api/validation-sets/test-id-error", () => {
    return new HttpResponse(null, { status: 500 });
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

describe("useValidationSet", () => {
  test("returns validation set data", async () => {
    const { result } = renderHook(() => useValidationSet("test-id-success"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toEqual(validationSetResponse);
    });
  });

  test("returns no data if the request fails", async () => {
    const { result } = renderHook(() => useValidationSet("test-id-fail"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  test("returns no data if the request is an error", async () => {
    const { result } = renderHook(() => useValidationSet("test-id-error"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isError);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });
});
