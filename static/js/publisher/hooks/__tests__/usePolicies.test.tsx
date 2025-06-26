import { QueryClient, QueryClientProvider } from "react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import usePolicies from "../usePolicies";

import type { ReactNode } from "react";

const queryClient = new QueryClient();

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const policiesResponse = [
  {
    authority: "test-authority",
    "created-at": "2023-09-05T11:55:53.732366",
    "created-by": {
      "display-name": "John Doe",
      email: "john.doe@canonical.com",
      id: "test-id",
      username: "johndoe",
      validation: "unproven",
    },
    "model-name": "test-model-name",
    revision: 1,
    "signing-key-sha3-384": "test-sha3",
  },
];

const handlers = [
  http.get("/api/store/test-store-id/models/test-id-success/policies", () => {
    return HttpResponse.json({
      data: policiesResponse,
      message: "",
      success: true,
    });
  }),
  http.get("/api/store/test-store-id/models/test-id-fail/policies", () => {
    return HttpResponse.json({
      data: [],
      message: "Unable to fetch policies",
      success: false,
    });
  }),
  http.get("/api/store/test-store-id/models/test-id-error/policies", () => {
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

describe("usePolicies", () => {
  test("returns policies data", async () => {
    const { result } = renderHook(
      () => usePolicies("test-store-id", "test-id-success"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toEqual(policiesResponse);
    });
  });

  test("returns no data if request fails", async () => {
    const { result } = renderHook(
      () => usePolicies("test-store-id", "test-id-fail"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  test("returns no data if error", async () => {
    const { result } = renderHook(
      () => usePolicies("test-store-id", "test-id-error"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => result.current.isError);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });
});
