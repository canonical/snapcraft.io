import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { renderHook, waitFor } from "@testing-library/react";

import useUserPrivileges from "../useUserPrivileges";

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

const userPrivilegesResponse = {
  "account-id": "test-account-id",
  permissions: ["package_access"],
};

const server = setupServer();

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

describe("useUserPrivileges", () => {
  test("returns user privileges if request successful", async () => {
    server.use(
      http.get("/api/whoami", () => {
        return HttpResponse.json({
          data: userPrivilegesResponse,
          success: true,
        });
      }),
    );

    const { result } = renderHook(() => useUserPrivileges(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(userPrivilegesResponse);
    });
  });

  test("returns no data if the request fails", async () => {
    server.use(
      http.get("/api/whoami", () => {
        return HttpResponse.json({
          data: {},
          message: "Unable to fetch user information",
          success: false,
        });
      }),
    );

    const { result } = renderHook(() => useUserPrivileges(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  test("returns no data if the request is an error", async () => {
    server.use(
      http.get("/api/whoami", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useUserPrivileges(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });
});
