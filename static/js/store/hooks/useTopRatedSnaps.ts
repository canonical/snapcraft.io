import { useQuery } from "react-query";

function useTopRatedSnaps() {
  return useQuery({
    queryKey: ["topRatedSnaps"],
    queryFn: async () => {
      const response = await fetch("/store.json");

      if (!response.ok) {
        throw new Error("There was a problem fetching top rated snaps");
      }

      const responseData = await response.json();

      return responseData.packages;
    },
  });
}

export default useTopRatedSnaps;
