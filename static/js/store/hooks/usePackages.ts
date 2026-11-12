import { useQuery } from "react-query";
import { nanoid } from "nanoid";

import type { UseQueryResult } from "react-query";
import type { Packages, Package } from "../types";

function usePackages(queryString: string): UseQueryResult<Packages, Error> {
  return useQuery({
    queryKey: ["data", queryString],
    queryFn: async () => {
      const response = await fetch(`/store.json${queryString}`);
      const data: Packages = await response.json();

      const packagesWithId = data.packages.map((item: Package) => {
        return {
          ...item,
          id: nanoid(),
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
