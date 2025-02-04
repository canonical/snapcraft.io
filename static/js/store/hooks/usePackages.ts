import { useQuery } from "react-query";
import { v4 as uuidv4 } from "uuid";

import type { Packages, Package } from "../types";

function usePackages(queryString: string) {
  return useQuery({
    queryKey: ["data", queryString],
    queryFn: async () => {
      const response = await fetch(`/store.json${queryString}`);
      const data: Packages = await response.json();

      const packagesWithId = data.packages.map((item: Package) => {
        return {
          ...item,
          id: uuidv4(),
        };
      });

      return {
        total_items: data.total_items,
        total_pages: data.total_pages,
        packages: packagesWithId,
        categories: data.categories,
      };
    },
    keepPreviousData: true,
  });
}

export default usePackages;
