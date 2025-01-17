import { useQuery } from "react-query";

function useBrandStores() {
  return useQuery({
    queryKey: ["brandStores"],
    queryFn: async () => {
      const response = await fetch("/api/stores");

      if (!response.ok) {
        throw new Error("Unable to fetch stores");
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error(responseData.message);
      }

      return responseData.data;
    },
  });
}

export default useBrandStores;
