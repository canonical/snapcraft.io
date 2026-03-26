import { useEffect, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { trackEvent } from "@canonical/analytics-events";

import Banner from "../../components/Banner";
import PackageList from "../../components/PackageList/PackageList";
import EmptyResultSection from "../../components/EmptyResultSection";

import { usePackages } from "../../hooks";

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

  useEffect(() => {
    if (searchTerm && status === "success" && !isFetching) {
      let searchId = sessionStorage.getItem("search_id");
      if (!searchId) {
        searchId = crypto.randomUUID();
        sessionStorage.setItem("search_id", searchId);
      }

      if (packagesCount > 0) {
        console.log("[analytics] snap_store_search_results_loaded", {
          search_id: searchId,
          query: searchTerm,
          total_items: data?.total_items ?? 0,
          page: currentPage,
        });
        trackEvent("snap_store_search_results_loaded", {
          search_id: searchId,
          query: searchTerm,
          total_items: data?.total_items ?? 0,
          page: currentPage,
        });
      } else {
        console.log("[analytics] snap_store_search_no_results", {
          search_id: searchId,
          query: searchTerm,
        });
        trackEvent("snap_store_search_no_results", {
          search_id: searchId,
          query: searchTerm,
        });
      }
    }
  }, [searchTerm, status, currentPage, searchParams, packagesCount, data, isFetching]);

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
