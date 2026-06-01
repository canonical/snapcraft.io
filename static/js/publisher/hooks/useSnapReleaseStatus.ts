import { useQuery } from "react-query";

function useSnapReleaseStatus(snapName: string | undefined) {
  return useQuery({
    queryKey: ["snapReleaseStatus", snapName],
    queryFn: async (): Promise<{ has_releases: boolean }> => {
      const response = await fetch(`/api/${snapName}/release-status`);
      if (!response.ok) {
        throw new Error("Failed to fetch release status");
      }

      return response.json();
    },
    enabled: Boolean(snapName),
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

export default useSnapReleaseStatus;
