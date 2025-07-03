import { QueryClient, QueryClientProvider } from "react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

import useModels from "../useModels";

import type { ReactNode } from "react";

const queryClient = new QueryClient();

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const modelsResponse = [
  {
    "api-key": "test-api-key",
    "brand-account-id": "test-brand-acount-id",
    "created-at": "2023-09-05T11:55:53.732366",
    "created-by": {
      "display-name": "John Doe",
      email: "john.doe@canonical.com",
      id: "test-id",
      username: "johndoe",
      validation: "unproven",
    },
    "modified-at": null,
    "modified-by": null,
    name: "test-model-name",
    series: "1",
  },
];

const handlers = [
  http.get("/api/store/test-brand-id/models", () => {
    return HttpResponse.json({
      data: modelsResponse,
      message: "",
      success: true,
    });
  }),
  http.get("/api/store/test-brand-id/models", () => {
    return HttpResponse.json({
      data: [],
      message: "Unable to fetch models",
      success: false,
    });
  }),
  http.get("/api/store/test-brand-id/models", () => {
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

describe("useModels", () => {
  test("returns models data", async () => {
    const { result } = renderHook(() => useModels("test-brand-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toEqual(modelsResponse);
    });
  });

  test("returns no data if request fails", async () => {
    const { result } = renderHook(() => useModels("test-brand-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  test("returns no data if error", async () => {
    const { result } = renderHook(() => useModels("test-brand-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isError);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });
});
