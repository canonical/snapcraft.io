import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";

import usePackages from "../usePackages";
import { testPackageData } from "../../test-utils/testPackageData";

import type { ReactNode } from "react";
import type { Packages } from "../../types";

const packagesResponse: Packages = {
  ...testPackageData,
  packages: testPackageData.packages.slice(0, 2),
};

const fetchMock = vi.fn<typeof fetch>();
let queryClient: QueryClient;

function renderPackages(queryString = "?q=k8s&page=2") {
  return renderHook(() => usePackages(queryString), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, cacheTime: 0 } },
  });
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => {
    return new Response(JSON.stringify(packagesResponse));
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.unstubAllGlobals();
});

describe("usePackages", () => {
  test("preserves the fetched shape and adds distinct nonempty IDs without mutating the response", async () => {
    // Return the same object so mutation of the parsed response is observable.
    fetchMock.mockResolvedValue({
      json: async () => packagesResponse,
    } as Response);
    const { result } = renderPackages();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith("/store.json?q=k8s&page=2");
    expect(result.current.data).toEqual({
      ...packagesResponse,
      packages: packagesResponse.packages.map((item) => ({
        ...item,
        id: expect.any(String),
      })),
    });
    const ids = result.current.data!.packages.map((item) => item.id);
    expect(ids.every((id) => Boolean(id))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      packagesResponse.packages.every((item) => item.id === undefined),
    ).toBe(true);
  });

  test("assigns independent IDs to duplicate or empty names and replaces any supplied ID", async () => {
    const item = packagesResponse.packages[0];
    const packages = [
      { ...item, id: "server-id" },
      { ...item, id: "server-id" },
      { ...item, package: { ...item.package, name: "" } },
      { ...item, package: { ...item.package, name: "" } },
    ];
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ...packagesResponse, packages })),
    );
    const { result } = renderPackages();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const ids = result.current.data!.packages.map((item) => item.id);
    expect(ids.every((id) => Boolean(id))).toBe(true);
    expect(new Set(ids).size).toBe(packages.length);
    expect(ids).not.toContain("server-id");
    expect(
      result.current.data!.packages.map((item) => item.package.name),
    ).toEqual(packages.map((item) => item.package.name));
  });

  test("keeps IDs across rerenders but generates fresh IDs when refetched", async () => {
    const { result, rerender } = renderPackages();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const data = result.current.data;
    const initialIds = data!.packages.map((item) => item.id);

    rerender();

    expect(result.current.data).toBe(data);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const refetchedIds = result.current.data!.packages.map((item) => item.id);
    expect(new Set([...initialIds, ...refetchedIds]).size).toBe(
      initialIds.length + refetchedIds.length,
    );
  });

  test("returns an empty package list and its metadata", async () => {
    const emptyResponse: Packages = {
      ...packagesResponse,
      packages: [],
      total_items: 0,
      total_pages: 0,
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(emptyResponse)));
    const { result } = renderPackages("");

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMock).toHaveBeenCalledWith("/store.json");
    expect(result.current.data).toEqual(emptyResponse);
  });

  test("exposes fetch errors without returning package data", async () => {
    const error = new Error("Unable to fetch packages");
    fetchMock.mockRejectedValue(error);
    const { result } = renderPackages();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    expect(result.current.data).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("exposes JSON parsing errors without returning package data", async () => {
    fetchMock.mockResolvedValue(new Response("invalid JSON"));
    const { result } = renderPackages();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.name).toBe("SyntaxError");
    expect(result.current.data).toBeUndefined();
  });
});
