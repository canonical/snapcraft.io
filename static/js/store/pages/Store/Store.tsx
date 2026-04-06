import { useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import Banner from "../../components/Banner";
import PackageList from "../../components/PackageList/PackageList";
import EmptyResultSection from "../../components/EmptyResultSection";

import { usePackages } from "../../hooks";
import { trackSearchResultsLoaded, trackSearchNoResults } from "../../utils";

function Store(): React.JSX.Element {
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

  const { data, status, isFetching } = usePackages(queryString);
  const packagesCount = data?.packages ? data?.packages.length : 0;
  const isResultExist = status === "success" && packagesCount > 0;

  const lastTrackedSearch = useRef<string>("");

  useEffect(() => {
    if (searchTerm && status === "success" && !isFetching) {
      if (lastTrackedSearch.current === searchTerm) return;
      lastTrackedSearch.current = searchTerm;

      if ((data?.total_items ?? 0) > 0) {
        trackSearchResultsLoaded(
          searchTerm,
          data?.total_items ?? 0,
          parseInt(currentPage),
        );
      } else {
        trackSearchNoResults(searchTerm);
      }
    }
  }, [searchTerm, status, currentPage, isFetching, packagesCount, data]);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchSummaryRef = useRef<HTMLDivElement>(null);

  return isResultExist || isFetching ? (
    <>
      <Banner searchRef={searchRef} searchSummaryRef={searchSummaryRef} />{" "}
      <PackageList
        data={data}
        isFetching={isFetching}
        searchRef={searchRef}
        searchSummaryRef={searchSummaryRef}
      />
    </>
  ) : (
    <EmptyResultSection
      searchTerm={searchTerm}
      data={data}
      isFetching={isFetching}
    />
  );
}

export default Store;
