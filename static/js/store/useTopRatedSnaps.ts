import { useQuery } from "react-query";

function useTrendingSnaps() {
  return useQuery({
    queryKey: ["newSnaps"],
    queryFn: async () => {
      const response = await fetch(
        `${window.RECOMMENDATIONS_API_URL}/category/trending`,
      );

      if (!response.ok) {
        throw new Error("There was a problem fetching trending snaps");
      }

      const responseData = await response.json();

      return responseData.packages;
    },
  });
}

export default useTrendingSnaps;
