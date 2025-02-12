import { useQuery } from "react-query";

function useNewSnaps() {
  return useQuery({
    queryKey: ["newSnaps"],
    queryFn: async () => {
      const response = await fetch("/store.json?categories=featured&page=1");

      if (!response.ok) {
        throw new Error("There was a problem fetching new snaps");
      }

      const responseData = await response.json();

      return responseData.packages;
    },
  });
}

export default useNewSnaps;
