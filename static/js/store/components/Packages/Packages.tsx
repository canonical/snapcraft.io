import React, { useEffect, useRef } from "react";
import { useQuery } from "react-query";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  Strip,
  Row,
  Col,
  Pagination,
  Button,
} from "@canonical/react-components";
import { DefaultCard } from "@canonical/store-components";

function Packages() {
  const ITEMS_PER_PAGE = 12;

  const getData = async () => {
    const response = await fetch(`/beta/store.json${search}`);
    const data = await response.json();
    const packagesWithId = data.packages.map((item: any) => {
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

  const currentPage = searchParams.get("page") || "1";
  const { data, status, refetch, isFetching } = useQuery("data", getData);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchSummaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refetch();
  }, [searchParams]);

  const firstResultNumber = (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + 1;
  const lastResultNumber =
    (parseInt(currentPage) - 1) * ITEMS_PER_PAGE + data?.packages.length;

  return (
    <>
      <Strip>
        <div className="u-fixed-width">
          {data?.packages && data?.packages.length > 0 && (
            <div className="u-fixed-width" ref={searchSummaryRef}>
              {searchParams.get("q") ? (
                <p>
                  Showing {currentPage === "1" ? "1" : firstResultNumber} to{" "}
                  {lastResultNumber} of {data?.total_items} results for{" "}
                  <strong>"{searchParams.get("q")}"</strong>.{" "}
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
                  Showing {currentPage === "1" ? "1" : firstResultNumber} to{" "}
                  {lastResultNumber} of {data?.total_items} items
                </p>
              )}
            </div>
          )}
          <Row>
            {isFetching &&
              [...Array(ITEMS_PER_PAGE)].map((item, index) => (
                <Col size={3} key={index}>
                  <h1>HI</h1>
                </Col>
              ))}

            {!isFetching &&
              status === "success" &&
              data.packages.length > 0 &&
              data.packages.map((packageData: any) => (
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
        </div>
      </Strip>
    </>
  );
}

export default Packages;
