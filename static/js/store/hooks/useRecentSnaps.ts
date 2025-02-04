import { useQuery } from "react-query";

function useRecentSnaps() {
  return useQuery({
    queryKey: ["updatedSnaps"],
    queryFn: async () => {
      const response = await fetch(
        `${window.RECOMMENDATIONS_API_URL}/category/recent`,
      );

      if (!response.ok) {
        throw new Error("There was a problem fetching updated snaps");
      }

      const responseData = await response.json();

      return responseData;
    },
  });
}

export default useRecentSnaps;
