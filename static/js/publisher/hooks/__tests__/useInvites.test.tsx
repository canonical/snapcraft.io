import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { renderHook, waitFor } from "@testing-library/react";

import { useInvites } from "../index";

import type { ReactNode } from "react";

const queryClient = new QueryClient();

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const invitesResponse = [
  {
    email: "john.doe@canonical.com",
    "expiration-date": "2025-04-13T12:40:55Z",
    roles: ["admin"],
    status: "Expired",
  },
];

const handlers = [
  http.get("/api/store/test-id-success/invites", () => {
    return HttpResponse.json(invitesResponse);
  }),
  http.get("/api/store/test-id-error/invites", () => {
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

describe("useInvites", () => {
  test("returns invites data", async () => {
    const { result } = renderHook(() => useInvites("test-id-success"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toEqual(invitesResponse);
    });
  });

  test("returns no data if error", async () => {
    const { result } = renderHook(() => useInvites("test-id-error"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isError);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });
});
