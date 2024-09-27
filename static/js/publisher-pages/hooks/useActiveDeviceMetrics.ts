import { useEffect, useState } from "react";
import { useQuery } from "react-query";

export interface IActiveDevices {
  activeDevices: {
    buckets: string[];
    name: string;
    series: any[];
  };
}

const MAX_PERIOD_BY_MONTH = 3;

function useActiveDeviceMetrics({
  snapId,
  period,
  type,
}: {
  snapId: string | undefined;
  period: string;
  type: string;
}) {
  const parsePeriod = (period: string) => {
    const [_, periodNumber, periodLength] = period.trim().split(/(\d+)/);
    return { periodNumber: +periodNumber, periodLength };
  };

  const getStartDate = (endDate: Date, period: string) => {
    const periodRegExp = /^(\d+)(d|m|y)$/;

    if (!period || !periodRegExp.test(period)) {
      return new Date(endDate.setDate(endDate.getDate() - 30));
    }

    const { periodNumber, periodLength } = parsePeriod(period);

    if (periodLength === "d") {
      return new Date(endDate.setDate(endDate.getDate() - +periodNumber));
    } else if (periodLength === "m") {
      return new Date(endDate.setMonth(endDate.getMonth() - +periodNumber));
    } else {
      // periodLength is 'y'
      return new Date(
        endDate.setFullYear(endDate.getFullYear() - +periodNumber)
      );
    }
  };

  // const [endDate, setEndDate] = useState(() => {
  //   return getEndDate(new Date(), `${MAX_PERIOD_BY_MONTH}m`);
  // });

  // const { status, data, isFetching } = useQuery({
  //   queryKey: ["activeDeviceMetrics", snapId, period, type],
  //   queryFn: async () => {
  //     const response = await fetch(
  //       `/${snapId}/metrics/active-devices?active-devices=${type}&start=${startDate.toISOString().split("T")[0]}&end=${endDate.toISOString().split("T")[0]}`
  //     );

  //     if (!response.ok) {
  //       if (response.status === 404) {
  //         return {
  //           latest_active_devices: 0,
  //           active_devices: {
  //             series: [],
  //             buckets: [],
  //           },
  //         };
  //       } else {
  //         throw new Error("Unable to fetch active device metrics");
  //       }
  //     }

  //     return await response.json();
  //   },
  //   retry: 0,
  //   refetchOnWindowFocus: false,
  // });

  const [fetchedData, setFetchedData] = useState<IActiveDevices | undefined>(
    undefined
  );

  const fetchData = async () => {
    const response = await fetch(
      `/${snapId}/metrics/active-devices?active-devices=${type}&period=2y&page=${1}`
    );

    const data = await response.json();

    const responses = [];
    for (let i = 2; i <= data.total_page_num; i++) {
      responses.push(
        fetch(
          `/${snapId}/metrics/active-devices?active-devices=${type}&period=1y&page=${i}`
        )
      );
    }

    const results = await Promise.all(responses);

    const buckets = [];
    const series = new Map();

    let seriesThatAreAddedBefore = 0;

    for (const result of results.reverse()) {
      const data = await result.json();

      const activeDeviceBuckets = data.active_devices.buckets;

      // merge data
      buckets.push(...data.active_devices.buckets);
      // fill the arr with 0's if the batch doesnt have that previous series
      for (const seriesKey of series.keys()) {
        if (
          !data.active_devices.series.find(
            (activeDeviceSeries: { name: string }) =>
              activeDeviceSeries.name === seriesKey
          )
        ) {
          series.set(seriesKey, [
            ...series.get(seriesKey),
            ...new Array(activeDeviceBuckets.length).fill(0),
          ]);
        }
      }

      for (const activeDeviceSeries of data.active_devices.series) {
        const key = activeDeviceSeries.name;
        const prevData = series.has(key)
          ? series.get(key)
          : new Array(seriesThatAreAddedBefore).fill(0);

        series.set(key, [...prevData, ...activeDeviceSeries.values]);
      }

      seriesThatAreAddedBefore += activeDeviceBuckets.length;
    }

    const resultArray = Array.from(series.entries()).map(([key, value]) => ({
      name: key,
      values: value,
    }));

    setFetchedData({
      activeDevices: {
        buckets,
        name: "",
        series: resultArray,
      },
    });
    // }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { status: "success", data: fetchedData, isFetching: false };
}

export default useActiveDeviceMetrics;
