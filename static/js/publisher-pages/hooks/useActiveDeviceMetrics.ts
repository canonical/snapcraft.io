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
    // const period = "1y";
    let endDate = new Date();
    const { periodLength, periodNumber } = parsePeriod(period);
    if (
      periodLength === "d" ||
      (periodLength === "m" && MAX_PERIOD_BY_MONTH >= periodNumber)
    ) {
      // no need to paginate
      const startDate = getStartDate(new Date(), period);
      const response = await fetch(
        `/${snapId}/metrics/active-devices?active-devices=${type}&start=${startDate.toISOString().split("T")[0]}&end=${endDate.toISOString().split("T")[0]}`
      );
      console.log(response);
    } else {
      // pagiante
      const numberOfIterations =
        periodLength === "y"
          ? Math.floor((periodNumber * 12) / MAX_PERIOD_BY_MONTH)
          : Math.floor(periodNumber / MAX_PERIOD_BY_MONTH);

      const responses = [];
      let extraDay = 0;
      for (let i = 0; i < numberOfIterations; i++) {
        const startDate = getStartDate(
          new Date(endDate),
          `${MAX_PERIOD_BY_MONTH}m`
        );
        const endDateForRequest = new Date(
          endDate.setDate(endDate.getDate() - extraDay)
        );
        console.log(
          startDate.toISOString().split("T")[0],
          endDateForRequest.toISOString().split("T")[0]
        );

        responses.push(
          fetch(
            `/${snapId}/metrics/active-devices?active-devices=${type}&start=${startDate.toISOString().split("T")[0]}&end=${endDateForRequest.toISOString().split("T")[0]}`
          )
        );
        endDate = new Date(startDate);
        extraDay = 1;
      }

      const results = await Promise.all(responses);

      const buckets = [];
      const series = new Map();

      let seriesThatAreAddedBefore = 0;

      for (const result of results.reverse()) {
        const data = await result.json();
        console.log(data);

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
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  return { status: "success", data: fetchedData, isFetching: false };
}

export default useActiveDeviceMetrics;
