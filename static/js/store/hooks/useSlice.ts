import { useQuery } from "react-query";

function useSlice(sliceId: string) {
  return useQuery({
    queryKey: [sliceId],
    queryFn: async () => {
      const response = await fetch(
        `${window.RECOMMENDATIONS_API_URL}/slice/${sliceId}`,
      );

      if (!response.ok) {
        throw new Error(`There was a problem fetching ${sliceId} snaps`);
      }

      const responseData = await response.json();

      return responseData;
    },
  });
}

export default useSlice;
