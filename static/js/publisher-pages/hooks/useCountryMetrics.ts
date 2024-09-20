import { useQuery } from "react-query";

function useCountryMetrics(snapId: string | undefined) {
  return useQuery({
    queryKey: ["countryMetrics", snapId],
    queryFn: async () => {
      const response = await fetch(`/${snapId}/metrics/country-metric`);

      if (!response.ok) {
        if (response.status === 404) {
          return {
            territories_total: 0,
            active_devices: {},
          };
        } else {
          throw new Error("Unable to fetch country metrics");
        }
      }

      return await response.json();
    },
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

export default useCountryMetrics;
