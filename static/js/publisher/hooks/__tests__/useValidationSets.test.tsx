import { QueryClient, QueryClientProvider } from "react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { renderHook, waitFor } from "@testing-library/react";

import useValidationSets from "../useValidationSets";

import type { ReactNode } from "react";

const queryClient = new QueryClient();

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const validationSetsResponse = [
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

describe("useValidationSets", () => {
  test("returns validation set data", async () => {
    server.use(
      http.get("/api/validation-sets", () => {
        return HttpResponse.json({
          data: validationSetsResponse,
          message: "",
          success: true,
        });
      }),
    );

    const { result } = renderHook(() => useValidationSets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toEqual(validationSetsResponse);
    });
  });

  test("returns no data if the request fails", async () => {
    server.use(
      http.get("/api/validation-sets", () => {
        return HttpResponse.json({
          data: [],
          message: "Unable to fetch validation set",
          success: false,
        });
      }),
    );
    const { result } = renderHook(() => useValidationSets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isSuccess);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  test("returns no data if the request is an error", async () => {
    server.use(
      http.get("/api/validation-sets", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useValidationSets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => result.current.isError);

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });
});
