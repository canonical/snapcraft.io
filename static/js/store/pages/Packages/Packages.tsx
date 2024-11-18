import { ReactNode } from "react";
import { useQuery } from "react-query";
import { useLocation, useSearchParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import type { Package, Store } from "../../types";
import { PackageList } from "../../components/PackageList/PackageList";
import { EmptyPackageSearch } from "./EmptyPackageSearch";

function Packages(): ReactNode {
  const getData = async (queryString: string) => {
    const response = await fetch(`/store.json${queryString}`);
    const data: Store = await response.json();

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
  };

  const { search } = useLocation();
  const [searchParams] = useSearchParams();

  const currentPage = searchParams.get("page") || "1";
  const searchTerm = searchParams.get("q");

  let queryString = search;
  if (
    !search ||
    (!searchParams.get("categories") &&
      !searchTerm &&
      !searchParams.get("architecture"))
  ) {
    queryString = `?categories=featured&page=${currentPage}`;
  } else {
    queryString += `&page=${currentPage}`;
  }

  const { data, status, isFetching } = useQuery(
    ["data", queryString],
    () => getData(queryString),
    {
      keepPreviousData: true,
    },
  );

  const packagesCount = data?.packages ? data?.packages.length : 0;
  const isResultExist = status === "success" && packagesCount > 0;

  return isResultExist || isFetching ? (
    <PackageList data={data} isFetching={isFetching} />
  ) : (
    <EmptyPackageSearch
      searchTerm={searchTerm}
      data={data}
      isFetching={isFetching}
    />
  );
}

export default Packages;
