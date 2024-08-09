import { useState, useEffect, ReactNode } from "react";
import { Button, Icon, Input, Select } from "@canonical/react-components";

import type { Model, Policy, SigningKey } from "../../types/shared";

type Props = {
  keyword: string;
  items: Model[] | Policy[] | SigningKey[];
  setItemsToShow: Function;
};

function AppPagination({ keyword, items, setItemsToShow }: Props): ReactNode {
  const paginationOptions = [
    {
      label: "25/page",
      value: 25,
    },
    {
      label: "50/page",
      value: 50,
    },
    {
      label: "100/page",
      value: 100,
    },
    {
      label: "200/page",
      value: 200,
    },
  ];

  const [pageSize, setPageSize] = useState<number>(paginationOptions[0].value);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [visibleItemsCount, setVisibleItemsCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(
    Math.ceil(items.length / pageSize)
  );

  useEffect(() => {
    const itemsToShow = items.slice(0, pageSize);

    setItemsToShow(itemsToShow);
    setCurrentPage(1);
    setVisibleItemsCount(itemsToShow.length);
    setTotalPages(Math.ceil(items.length / pageSize));
  }, [items, pageSize]);

  useEffect(() => {
    const multiplier = currentPage - 1;
    const itemsToShow = items.slice(
      pageSize * multiplier,
      pageSize * multiplier + pageSize
    );

    setItemsToShow(itemsToShow);
    setVisibleItemsCount(itemsToShow.length);
  }, [currentPage]);

  return (
    <div className="app-pagination">
      <div className="app-pagination__description">
        Showing {pageSize * currentPage - pageSize + 1} to{" "}
        {pageSize * currentPage - pageSize + visibleItemsCount} out of{" "}
        {items.length} {keyword}
        {items.length > 1 ? "s" : ""}
      </div>
      <div className="app-pagination__controls">
        <Button
          aria-label="Previous page"
          appearance="base"
          hasIcon
          className="app-pagination__back"
          disabled={currentPage === 1}
          onClick={() => {
            setCurrentPage(currentPage - 1);
          }}
        >
          <Icon name="chevron-down" />
        </Button>
        <Input
          type="number"
          id="paginationPageInput"
          className="app-pagination__page-number u-no-margin--bottom"
          value={currentPage}
          label="Page number"
          labelClassName="u-off-screen u-off-screen--top"
          onChange={(e) => {
            setCurrentPage(
              Math.min(totalPages, Math.max(1, parseInt(e.target.value)))
            );
          }}
        />{" "}
        of {totalPages}
        <Button
          appearance="base"
          className="app-pagination__next"
          disabled={totalPages === 1 || currentPage === totalPages}
          aria-label="Next page"
          hasIcon
          onClick={() => {
            setCurrentPage(currentPage + 1);
          }}
        >
          <Icon name="chevron-down" />
        </Button>
        <Select
          label="Items per page"
          labelClassName="u-off-screen u-off-screen--top"
          id="itemsPerPage"
          options={paginationOptions}
          onChange={(e) => {
            setPageSize(parseInt(e.target.value));
          }}
          value={pageSize}
          className="app-pagination__page-size u-no-margin--bottom"
        />
      </div>
    </div>
  );
}

export default AppPagination;
