import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "react-query";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  Strip,
  Row,
  Col,
  Pagination,
  Button,
} from "@canonical/react-components";
import { DefaultCard, LoadingCard, Filters } from "@canonical/store-components";

import Banner from "../Banner";

import type { Package } from "../../types/shared";

function Packages() {
  const ITEMS_PER_PAGE = 15;

  const getData = async () => {
    let queryString = search;

    if (!search) {
      queryString = "?categories=featured";
    }

    if (search && !search.includes("categories=")) {
      queryString += "&categories=featured";
    }

    const response = await fetch(`/beta/store.json${queryString}`);
    const data = await response.json();
    const packagesWithId = data.packages.map((item: Package) => {
      return {
        ...item,
        id: crypto.randomUUID(),
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

  const firstResultNumber = (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + 1;
  const lastResultNumber =
    (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + data?.packages.length;

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
                <Filters
                  showMore
                  showMoreCount={10}
                  categories={data?.categories || []}
                  selectedCategories={
                    searchParams.get("categories")?.split(",") || []
                  }
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
                  architectures={[
                    {
                      name: "",
                      display_name: "All",
                    },
                    {
                      name: "amd64",
                      display_name: "AMD64",
                    },
                    {
                      name: "arm64",
                      display_name: "ARM64",
                    },
                    {
                      name: "armhf",
                      display_name: "ARMHF",
                    },
                    {
                      name: "i386",
                      display_name: "I386",
                    },
                    {
                      name: "ppc64el",
                      display_name: "PPC64EL",
                    },
                    {
                      name: "s390x",
                      display_name: "S390X",
                    },
                  ]}
                  selectedArchitecture={searchParams.get("architecture") || ""}
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
                  order={[
                    "development",
                    "games",
                    "social",
                    "productivity",
                    "utilities",
                    "music-and-audio",
                    "art-and-design",
                    "photo-and-video",
                    "server-and-cloud",
                  ]}
                />
              </div>
            </div>
          </Col>
          <Col size={9}>
            {data?.packages && data?.packages.length > 0 && (
              <div ref={searchSummaryRef}>
                {isFeatured && <h2>Featured snaps</h2>}
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
                  <Col size={3} className="u-align--right">
                    <p>Sorted by relevance</p>
                  </Col>
                </Row>
              </div>
            )}
            <Row>
              {isFetching &&
                [...Array(ITEMS_PER_PAGE)].map((item, index) => (
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
