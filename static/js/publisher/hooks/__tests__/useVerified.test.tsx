import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { renderHook, waitFor } from "@testing-library/react";

import useVerified from "../useVerified";

import type { ReactNode } from "react";

const queryClient = new QueryClient();

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const handlers = [
  http.get("/api/test-snap-verified/verify", () => {
    return HttpResponse.json({
      primary_domain: true,
    });
  }),
  http.get("/api/test-snap-unverified/verify", () => {
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

describe("useVerified", () => {
  test("returns verified data", async () => {
    const { result } = renderHook(() => useVerified("test-snap-verified"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toEqual({ primary_domain: true });
    });
  });

  test("returns no data if error", async () => {
    const { result } = renderHook(() => useVerified("test-snap-unverified"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });
});
