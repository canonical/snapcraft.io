import { useQuery } from "react-query";

function useActiveDeviceMetrics({
  snapId,
  period,
  type,
}: {
  snapId: string | undefined;
  period: string;
  type: string;
}) {
  const { status, data, isFetching } = useQuery({
    queryKey: ["activeDeviceMetrics", snapId, period, type],
    queryFn: async () => {
      return await fetchData();
    },
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const parsePeriod = (period: string) => {
    const [_, periodLength, periodTime] = period.trim().split(/(\d+)/);
    return { periodLength: +periodLength, periodTime };
  };

  const fetchData = async () => {
    const { periodTime, periodLength } = parsePeriod(period);
    const pagePeriodLengthInMonths = 3;

    let totalPage = 1;
    if (
      periodTime === "d" ||
      (periodTime === "m" && periodLength <= pagePeriodLengthInMonths)
    ) {
      totalPage = 1;
    } else {
      totalPage =
        periodTime === "y"
          ? Math.floor((periodLength * 12) / pagePeriodLengthInMonths)
          : Math.floor(periodLength / pagePeriodLengthInMonths);
    }

    const responses = [];
    for (let i = 1; i <= totalPage; i++) {
      responses.push(
        fetch(
          `/${snapId}/metrics/active-devices?active-devices=${type}&period=${period}&page=${i}&page-length=${pagePeriodLengthInMonths}`
        )
      );
    }

    const results = await Promise.all(responses);

    return await formatData(results);
  };

  const handleResponse = async (response: Response) => {
    if (!response.ok) {
      if (response.status === 404) {
        return {
          active_devices: {
            buckets: [],
            series: [],
          },
        };
      } else {
        throw new Error("Unable to fetch latest active device information");
      }
    }

    const data = await response.json();
    return data;
  };

  const formatData = async (results: Response[]) => {
    const buckets = [];
    const series = new Map();

    let seriesThatAreAddedBefore = 0;

    for (const result of results.reverse()) {
      const data = await handleResponse(result);

      const activeDeviceBuckets = data.active_devices.buckets;

      buckets.push(...activeDeviceBuckets);
      // fill the array with 0's if the batch doesnt have that previous series
      for (const seriesKey of series.keys()) {
        const seriesExistInBatch = data.active_devices.series.find(
          (activeDeviceSeries: { name: string }) =>
            activeDeviceSeries.name === seriesKey
        );
        if (!seriesExistInBatch) {
          series.set(seriesKey, [
            ...series.get(seriesKey),
            ...new Array(activeDeviceBuckets.length).fill(0),
          ]);
        }
      }

      // fill the array with 0's if new series introduced in the batch
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

    return {
      activeDevices: {
        buckets,
        series: resultArray,
      },
    };
  };

  return { status, data, isFetching };
}

export default useActiveDeviceMetrics;
