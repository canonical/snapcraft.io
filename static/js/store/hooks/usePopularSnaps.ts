import { useQuery } from "react-query";

function usePopularSnaps() {
  return useQuery({
    queryKey: ["popularSnaps"],
    queryFn: async () => {
      const response = await fetch("/store.json");

      if (!response.ok) {
        throw new Error("There was a problem fetching popular snaps");
      }

      const responseData = await response.json();

      return responseData.packages;
    },
  });
}

export default usePopularSnaps;
