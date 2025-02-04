import { useQuery } from "react-query";

function useUpdatedSnaps() {
  return useQuery({
    queryKey: ["updatedSnaps"],
    queryFn: async () => {
      const response = await fetch("/store.json");

      if (!response.ok) {
        throw new Error("There was a problem fetching updated snaps");
      }

      const responseData = await response.json();

      return responseData.packages;
    },
  });
}

export default useUpdatedSnaps;
