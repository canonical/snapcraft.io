import { useQuery } from "react-query";

function useOrderedSnaps(category: string) {
  return useQuery({
    queryKey: [category],
    queryFn: async () => {
      const response = await fetch(
        `${window.RECOMMENDATIONS_API_URL}/category/${category}`,
      );

      if (!response.ok) {
        throw new Error(`There was a problem fetching ${category} snaps`);
      }

      const responseData = await response.json();

      return responseData;
    },
  });
}

export default useOrderedSnaps;
