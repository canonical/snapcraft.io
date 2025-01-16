import { useQuery } from "react-query";

function useSnaps(storeId: string) {
  return useQuery({
    queryKey: ["snaps"],
    queryFn: async () => {
      const response = await fetch(`/api/store/${storeId}/snaps`);

      if (!response.ok) {
        throw new Error("Unable to fetch snaps");
      }

      const responseData = await response.json();

      return responseData;
    },
  });
}

export default useSnaps;
