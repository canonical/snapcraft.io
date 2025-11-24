import { useQuery } from "react-query";
import { ISnap } from "../types";

type Series = {
  name: string;
  values: Array<number>;
};

type SnapMetrics = {
  series: Array<Series>;
  buckets: Array<string>;
};

function useFetchPublishedSnapMetrics(snaps: ISnap[]) {
  return useQuery({
    queryKey: ["publishedSnapMetrics", snaps],
    queryFn: async () => {
      const snapList = snaps.reduce(
        (acc, item) => {
          acc[item.snapName] = item["snap-id"];
          return acc;
        },
        {} as { [name: string]: string },
      );

      const response = await fetch("/snaps/metrics/json", {
        method: "POST",
        body: JSON.stringify(snapList),
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": window.CSRF_TOKEN,
        },
      });
      if (!response.ok) {
        throw new Error("Something went wrong. Please try again later.");
      }

      const data = await response.json();

      const metrics: SnapMetrics = {
        series: [],
        buckets: data.buckets,
      };

      data.snaps.forEach((snap: { series: Array<Series>; name: string }) => {
        const continuedDevices = snap.series.filter(
          (singleSeries) => singleSeries.name === "continued",
        )[0];
        const newDevices = snap.series.filter(
          (singleSeries) => singleSeries.name === "new",
        )[0];

        let totalSeries: Array<number> = [];

        if (continuedDevices && newDevices) {
          totalSeries = continuedDevices.values.map((continuedValue, index) => {
            return continuedValue + newDevices.values[index];
          });
        }

        metrics.series.push({
          name: snap.name,
          values: totalSeries,
        });
      });
      return metrics;
    },
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

export default useFetchPublishedSnapMetrics;
