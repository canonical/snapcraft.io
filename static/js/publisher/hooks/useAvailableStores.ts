import { useQuery } from "react-query";

function useAvailableStores() {
  return useQuery({
    queryKey: "availableStores",
    queryFn: async () => {
      const response = await fetch("/api/available-stores");

      if (!response.ok) {
        throw new Error("Unable to fetch available stores");
      }

      const responseData = await response.json();

      const stores = [
        {
          name: "Global",
          id: "ubuntu",
        },
      ];

      if (responseData.success) {
        return stores.concat(responseData.data);
      } else {
        return stores;
      }
    },
  });
}

export default useAvailableStores;
