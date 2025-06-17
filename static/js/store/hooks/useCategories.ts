import { useQuery } from "react-query";

function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/store.json");

      if (!response.ok) {
        throw new Error("There was a problem fetching new snaps");
      }

      const responseData = await response.json();

      return responseData.categories;
    },
  });
}

export default useCategories;
