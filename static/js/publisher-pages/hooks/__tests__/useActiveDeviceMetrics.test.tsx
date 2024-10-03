import * as ReactQuery from "react-query";
import { QueryClient, QueryClientProvider } from "react-query";
import { renderHook, waitFor } from "@testing-library/react";
import useActiveDeviceMetrics from "../useActiveDeviceMetrics";

describe("useActiveDeviceMetrics", () => {
  test("Calls useQuery", () => {
    const spy = jest.spyOn(ReactQuery, "useQuery").mockReturnValue({
      data: [],
      status: "success",
      isFetcing: false,
    } as any);

    renderHook(() =>
      useActiveDeviceMetrics({
        period: "30d",
        snapId: "test-id",
        type: "version",
      })
    );
    expect(ReactQuery.useQuery).toHaveBeenCalled();
    spy.mockRestore();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient();
    return ({ children }: any) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  test("if the page size is set to less than 3 months, do not paginate ", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            active_devices: {
              buckets: [
                "2024-09-26",
                "2024-09-27",
                "2024-09-28",
                "2024-09-29",
                "2024-09-30",
              ],
              name: "weekly_installed_base_by_version",
              series: [
                {
                  name: "1.0",
                  values: [5, 5, 0, 4, 4],
                },
              ],
            },
            latest_active_devices: 4,
            total_page_num: 1,
          }),
        ok: true,
      })
    ) as jest.Mock;

    const { result } = renderHook(
      () =>
        useActiveDeviceMetrics({
          period: "30d",
          snapId: "test-id",
          type: "version",
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.data).toMatchObject({
      activeDevices: {
        buckets: [
          "2024-09-26",
          "2024-09-27",
          "2024-09-28",
          "2024-09-29",
          "2024-09-30",
        ],
        series: [{ name: "1.0", values: [5, 5, 0, 4, 4] }],
      },
    });
    (global.fetch as jest.Mock).mockRestore();
  });

  test("if the page size is greater than 3 months, request data over multiple requests", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            active_devices: {
              buckets: [
                "2024-09-26",
                "2024-09-27",
                "2024-09-28",
                "2024-09-29",
                "2024-09-30",
              ],
              name: "weekly_installed_base_by_version",
              series: [
                {
                  name: "1.0",
                  values: [5, 5, 0, 4, 4],
                },
              ],
            },
            latest_active_devices: 4,
            total_page_num: 1,
          }),
        ok: true,
      })
    ) as jest.Mock;

    const { result } = renderHook(
      () =>
        useActiveDeviceMetrics({
          period: "2y",
          snapId: "test-id",
          type: "version",
        }),
      {
        wrapper: createWrapper(),
      }
    );

    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(global.fetch).toHaveBeenCalledTimes(8);
    (global.fetch as jest.Mock).mockRestore();
  });

  test("if the request 404, empty data should be returned", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(undefined),
        ok: false,
        status: 404,
      })
    ) as jest.Mock;

    const { result } = renderHook(
      () =>
        useActiveDeviceMetrics({
          period: "30d",
          snapId: "test-id",
          type: "version",
        }),
      {
        wrapper: createWrapper(),
      }
    );
    await waitFor(() => expect(result.current.status).toBe("success"));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.data).toMatchObject({
      activeDevices: {
        buckets: [],
        series: [],
      },
    });
    (global.fetch as jest.Mock).mockRestore();
  });
});
