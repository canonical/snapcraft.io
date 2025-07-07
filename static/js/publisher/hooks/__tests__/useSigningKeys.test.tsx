import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { renderHook, waitFor } from "@testing-library/react";

import { useSigningKeys } from "../index";

import type { ReactNode } from "react";

const queryClient = new QueryClient();

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const signingKeysResponse = [
  {
    "brand-account-id": "test-brand-account-id",
    "created-at": "2023-06-22T12:45:28.301419",
    "created-by": {
      "display-name": "John Doe",
      email: "john.doe@canonical.com",
      id: "test-id",
      username: "johndoe",
      validation: "unproven",
    },
    fingerprint: "test-fingerprint",
    "modified-at": null,
    "modified-by": null,
    name: "test-name",
    "sha3-384": "test-sha",
  },
];

const handlers = [
  http.get("/api/store/test-id-success/signing-keys", () => {
    return HttpResponse.json({
      data: signingKeysResponse,
      message: "",
      success: true,
    });
  }),
  http.get("/api/store/test-id-fail/signing-keys", () => {
    return HttpResponse.json({
      data: {},
      message: "Unable to fetch signing keys",
      success: false,
    });
  }),
  http.get("/api/store/test-id-error/signing-keys", () => {
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

describe("useSigningKeys", () => {
  test("returns signing keys data", async () => {
    const { result } = renderHook(() => useSigningKeys("test-id-success"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toEqual(signingKeysResponse);
    });
  });

  test("returns no data if request fails", async () => {
    const { result } = renderHook(() => useSigningKeys("test-id-fail"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  test("returns no data if error", async () => {
    const { result } = renderHook(() => useSigningKeys("test-id-error"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isError);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });
});
