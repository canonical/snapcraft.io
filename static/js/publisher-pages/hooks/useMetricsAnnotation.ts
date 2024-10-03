import { useQuery } from "react-query";

function useMetricsAnnotation(snapId?: string) {
  return useQuery({
    queryKey: ["annotationMetrics", snapId],
    queryFn: async () => {
      const response = await fetch(
        `/${snapId}/metrics/active-device-annotation`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch active device annotations");
      }

      const data = await response.json();

      return data;
    },
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

export default useMetricsAnnotation;
