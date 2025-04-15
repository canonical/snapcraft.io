import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { renderHook, waitFor } from "@testing-library/react";

import useBrand from "../useBrand";

import type { ReactNode } from "react";

const queryClient = new QueryClient();

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const brandResponse = {
  "account-id": "test-account-id",
  "created-at": "test-creation-date",
  "created-by": {
    "display-name": "John Doe",
    email: "john.doe@canonical.com",
    id: "test-user-id",
    username: "johndoe",
    validation: "unproven",
  },
  "modified-at": null,
  "modified-by": null,
  name: "Test brand name",
};

const handlers = [
  http.get("/api/store/test-id-success/brand", () => {
    return HttpResponse.json({
      data: brandResponse,
      success: true,
    });
  }),
  http.get("/api/store/test-id-fail/brand", () => {
    return HttpResponse.json({
      data: {},
      message: "Unable to fetch brand data",
      success: false,
    });
  }),
  http.get("/api/store/test-id-error/brand", () => {
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

describe("useBrand", () => {
  test("returns brand data if request successful", async () => {
    const { result } = renderHook(() => useBrand("test-id-success"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toEqual(brandResponse);
    });
  });

  test("returns no data if the request fails", async () => {
    const { result } = renderHook(() => useBrand("test-id-fail"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  test("returns no data if the request is an error", async () => {
    const { result } = renderHook(() => useBrand("test-id-error"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isError);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });
});
