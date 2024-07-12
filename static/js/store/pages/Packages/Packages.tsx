import { useState, useEffect, useRef, ReactNode } from "react";
import { useQuery } from "react-query";
import { useLocation, useSearchParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  Strip,
  Row,
  Col,
  Pagination,
  Button,
} from "@canonical/react-components";
import { DefaultCard, LoadingCard, Filters } from "@canonical/store-components";

import Banner from "../../components/Banner";

import { getArchitectures, getCategoryOrder } from "../../utils";

import type { Package, Category } from "../../types";

function Packages(): ReactNode {
  const ITEMS_PER_PAGE = 15;
  const SHOW_MORE_COUNT = 10;
  const CATEGORY_ORDER = getCategoryOrder();

  const getData = async () => {
    let queryString = search;

    if (!search) {
      queryString = "?categories=featured";
    }

    const response = await fetch(`/beta/store.json${queryString}`);
    const data: {
      total_items: number;
      total_pages: number;
      packages: Package[];
      categories: Category[];
    } = await response.json();

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
  const [searchParams, setSearchParams] = useSearchParams();

  const [hideFilters, setHideFilters] = useState(true);
  const currentPage = searchParams.get("page") || "1";
  const { data, status, refetch, isFetching } = useQuery("data", getData);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchSummaryRef = useRef<HTMLDivElement>(null);

  const isFeatured =
    !searchParams.get("categories") &&
    !searchParams.get("q") &&
    !searchParams.get("architectures");

  useEffect(() => {
    refetch();
  }, [searchParams]);

  const packagesCount = data?.packages ? data?.packages.length : 0;

  const firstResultNumber = (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + 1;
  const lastResultNumber =
    (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + packagesCount;

  const getCategoryDisplayName = (name: string) => {
    const category = data?.categories?.find(
      (cat: Category) => cat.name === name
    );

    return category?.display_name;
  };
  const selectedCategories = searchParams.get("categories")?.split(",");
  let showAllCategories = false;

  const selectedFiltersNotVisible = (
    selectedFilters: Array<string>,
    allFilters: Array<Category>
  ) => {
    const sortedFilters = [] as Array<Category>;

    CATEGORY_ORDER.forEach((item) => {
      const filter = allFilters.find((category) => category.name === item);
      if (filter) {
        sortedFilters.push(filter);
      }
    });

    allFilters.forEach((filter) => {
      if (!CATEGORY_ORDER.includes(filter.name)) {
        sortedFilters.push(filter);
      }
    });

    return selectedFilters.some((selectedFilter) => {
      const currentFilter = allFilters.find(
        (filter: Category) => filter.name === selectedFilter
      );

      if (currentFilter) {
        return sortedFilters.indexOf(currentFilter) > SHOW_MORE_COUNT - 1;
      }

      return false;
    });
  };

  if (
    selectedCategories &&
    data &&
    data.categories &&
    selectedFiltersNotVisible(selectedCategories, data.categories)
  ) {
    showAllCategories = true;
  }

  const getResultsTitle = () => {
    if (!selectedCategories) {
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

  return (
    <>
      <Banner searchRef={searchRef} searchSummaryRef={searchSummaryRef} />
      <Strip>
        <Row>
          <Col size={3}>
            <Button
              className="has-icon u-hide--large p-filter-panel__toggle"
              onClick={() => {
                setHideFilters(false);
              }}
            >
              <i className="p-icon--arrow-right"></i>
              <span>Filters</span>
            </Button>
            <div
              className={`p-filter-panel-overlay u-hide--large ${
                hideFilters ? "u-hide--small u-hide--medium" : ""
              }`}
              onClick={() => {
                setHideFilters(true);
              }}
            ></div>

            <div
              className={`p-filter-panel ${
                !hideFilters ? "p-filter-panel--expanded" : ""
              }`}
            >
              <div className="p-filter-panel__header">
                <Button
                  className="has-icon u-hide--large u-no-margin--bottom u-no-padding--left"
                  appearance="base"
                  onClick={() => {
                    setHideFilters(true);
                  }}
                >
                  <i className="p-icon--chevron-down"></i>
                  <span>Hide filters</span>
                </Button>
              </div>
              <div className="p-filter-panel__inner">
                {data && (
                  <Filters
                    showMore
                    showMoreCount={SHOW_MORE_COUNT}
                    displayAllCategories={showAllCategories}
                    categories={data?.categories || []}
                    selectedCategories={selectedCategories || []}
                    setSelectedCategories={(
                      items: Array<{
                        display_name: string;
                        name: string;
                      }>
                    ) => {
                      if (items.length > 0) {
                        searchParams.set("categories", items.join(","));
                      } else {
                        searchParams.delete("categories");
                      }

                      searchParams.delete("page");
                      setSearchParams(searchParams);
                    }}
                    architectures={getArchitectures()}
                    selectedArchitecture={
                      searchParams.get("architecture") || ""
                    }
                    setSelectedArchitecture={(item: string) => {
                      if (item) {
                        searchParams.set("architecture", item);
                      } else {
                        searchParams.delete("architecture");
                      }

                      searchParams.delete("page");
                      setSearchParams(searchParams);
                    }}
                    disabled={isFetching}
                    order={CATEGORY_ORDER}
                  />
                )}
              </div>
            </div>
          </Col>
          <Col size={9}>
            {status === "success" && data.packages.length > 0 && (
              <div ref={searchSummaryRef}>
                {isFeatured ? (
                  <h2>Featured snaps</h2>
                ) : (
                  <h2>{getResultsTitle()}</h2>
                )}
                <Row>
                  <Col size={6}>
                    {searchParams.get("q") ? (
                      <p>
                        Showing {currentPage === "1" ? "1" : firstResultNumber}{" "}
                        to {lastResultNumber} of{" "}
                        {data?.total_items < 100
                          ? data?.total_items
                          : "over 100"}{" "}
                        results for <strong>"{searchParams.get("q")}"</strong>.{" "}
                        <Button
                          appearance="link"
                          onClick={() => {
                            searchParams.delete("q");
                            searchParams.delete("page");
                            setSearchParams(searchParams);

                            if (searchRef.current) {
                              searchRef.current.value = "";
                            }
                          }}
                        >
                          Clear search
                        </Button>
                      </p>
                    ) : (
                      <p>
                        Showing {currentPage === "1" ? "1" : firstResultNumber}{" "}
                        to {lastResultNumber} of{" "}
                        {data?.total_items < 100
                          ? data?.total_items
                          : "over 100"}{" "}
                        items
                      </p>
                    )}
                  </Col>
                </Row>
              </div>
            )}
            <Row>
              {isFetching &&
                [...Array(ITEMS_PER_PAGE)].map((_item, index) => (
                  <Col size={3} key={index}>
                    <LoadingCard />
                  </Col>
                ))}

              {!isFetching &&
                status === "success" &&
                data.packages.length > 0 &&
                data.packages.map((packageData: Package) => (
                  <Col
                    size={3}
                    style={{ marginBottom: "1.5rem" }}
                    key={packageData.id}
                  >
                    <DefaultCard data={packageData} />
                  </Col>
                ))}

              {status === "success" && data.packages.length === 0 && (
                <h1 className="p-heading--2">No packages match this filter</h1>
              )}
            </Row>

            {status === "success" && data.packages.length > 0 && (
              <Pagination
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={data.total_items}
                paginate={(pageNumber) => {
                  searchParams.set("page", pageNumber.toString());
                  setSearchParams(searchParams);
                }}
                currentPage={parseInt(currentPage)}
                centered
                scrollToTop
              />
            )}
          </Col>
        </Row>
      </Strip>
    </>
  );
}

export default Packages;
