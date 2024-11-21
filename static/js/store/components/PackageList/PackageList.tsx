import {
  Button,
  Col,
  Pagination,
  Row,
  Strip,
} from "@canonical/react-components";
import Banner from "../Banner";
import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Category, Package, Store } from "../../types";
import { PackageFilter } from "../PackageFilter";
import { DefaultCard, LoadingCard } from "@canonical/store-components";

const ITEMS_PER_PAGE = 15;

export const PackageList = ({
  data,
  isFetching,
}: {
  data?: Store;
  isFetching: boolean;
}) => {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchSummaryRef = useRef<HTMLDivElement>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategories =
    searchParams.get("categories")?.split(",").filter(Boolean) || [];
  const isFeatured =
    selectedCategories.length === 0 ||
    (selectedCategories.length === 1 && selectedCategories[0] === "featured");

  const packagesCount = data?.packages ? data?.packages.length : 0;

  const currentPage = searchParams.get("page") || "1";
  const firstResultNumber = (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + 1;
  const lastResultNumber =
    (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + packagesCount;

  const getCategoryDisplayName = (name: string) => {
    const category = data?.categories?.find(
      (cat: Category) => cat.name === name,
    );
    return category?.display_name;
  };

  const getResultsTitle = () => {
    if (searchParams.get("q")) {
      return "Snaps";
    }

    if (isFeatured) {
      return "Featured snaps";
    }

    if (selectedCategories.length === 0) {
      return;
    }

    if (selectedCategories.length === 2) {
      return `${getCategoryDisplayName(selectedCategories[0])} and 1 more category`;
    }

    if (selectedCategories.length > 1) {
      return `${getCategoryDisplayName(selectedCategories[0])} and ${selectedCategories.length - 1} more categories`;
    }

    return getCategoryDisplayName(selectedCategories[0]);
  };

  const onClear = () => {
    searchParams.delete("q");
    searchParams.delete("page");
    setSearchParams(searchParams);

    if (searchRef.current) {
      searchRef.current.value = "";
    }
  };

  const overHundredText =
    data?.total_items && data?.total_items > 100
      ? "over 100"
      : data?.total_items;

  return (
    <>
      <Banner searchRef={searchRef} searchSummaryRef={searchSummaryRef} />
      <Strip>
        <Row>
          <Col size={3}>
            <PackageFilter data={data} disabled={isFetching} />
          </Col>
          <Col size={9}>
            <div ref={searchSummaryRef}>
              <h2>{getResultsTitle()}</h2>
              <Row>
                <Col size={6}>
                  {searchParams.get("q") ? (
                    <p>
                      Showing {currentPage === "1" ? "1" : firstResultNumber} to{" "}
                      {lastResultNumber} of {overHundredText} results for{" "}
                      <strong>"{searchParams.get("q")}"</strong>.{" "}
                      <Button appearance="link" onClick={onClear}>
                        Clear search
                      </Button>
                    </p>
                  ) : (
                    <p>
                      Showing {currentPage === "1" ? "1" : firstResultNumber} to{" "}
                      {lastResultNumber} of {overHundredText} items
                    </p>
                  )}
                </Col>
              </Row>
            </div>

            <Row>
              {isFetching &&
                [...Array(ITEMS_PER_PAGE)].map((_item, index) => (
                  <Col size={3} key={index}>
                    <LoadingCard />
                  </Col>
                ))}
              {!isFetching &&
                data &&
                data.packages.map((packageData: Package) => (
                  <Col
                    size={3}
                    style={{ marginBottom: "1.5rem" }}
                    key={packageData.id}
                  >
                    <DefaultCard data={packageData} />
                  </Col>
                ))}
            </Row>

            <Pagination
              itemsPerPage={ITEMS_PER_PAGE}
              totalItems={data ? data.total_items : 0}
              paginate={(pageNumber) => {
                searchParams.set("page", pageNumber.toString());
                setSearchParams(searchParams);
              }}
              currentPage={parseInt(currentPage)}
              centered
              scrollToTop
            />
          </Col>
        </Row>
      </Strip>
    </>
  );
};
