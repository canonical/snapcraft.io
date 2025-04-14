import { Button } from "@canonical/react-components";
import { useState } from "react";
import { Filters } from "@canonical/store-components";
import { useSearchParams } from "react-router-dom";
import { getArchitectures, getCategoryOrder } from "../../utils";

import type { Category, Packages } from "../../types";

export type ICategoryList =
  | {
      display_name: string;
      name: string;
    }[]
  | string[];

const SHOW_MORE_COUNT = 10;
const CATEGORY_ORDER = getCategoryOrder();

interface IProps {
  data?: Packages;
  disabled: boolean;
}

export const PackageFilter = ({
  data,
  disabled,
}: IProps): React.JSX.Element => {
  const [hideFilters, setHideFilters] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategories =
    searchParams.get("categories")?.split(",").filter(Boolean) || [];

  const onCategoryChange = (items: ICategoryList): void => {
    const categoryNames = items
      .map((item) => (typeof item === "string" ? item : item.name))
      .filter(Boolean);
    if (categoryNames.length > 0) {
      if (categoryNames.includes("featured")) {
        categoryNames.splice(categoryNames.indexOf("featured"), 1);
      }
      searchParams.set("categories", categoryNames.join(","));
    } else {
      searchParams.delete("categories");
    }

    searchParams.delete("page");
    setSearchParams(searchParams);
  };

  const onArchitectureChange = (item: string): void => {
    if (item) {
      searchParams.set("architecture", item);
      if (searchParams.get("categories") === "featured") {
        searchParams.delete("categories");
      }
    } else {
      searchParams.delete("architecture");
    }

    searchParams.delete("page");
    setSearchParams(searchParams);
  };

  const selectedFiltersNotVisible = (
    selectedFilters: string[],
    allFilters: Category[],
  ): boolean | undefined => {
    const sortedFilters = [] as Category[];

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
        (filter: Category) => filter.name === selectedFilter,
      );

      if (currentFilter) {
        return sortedFilters.indexOf(currentFilter) > SHOW_MORE_COUNT - 1;
      }

      return false;
    });
  };

  const showAllCategories =
    selectedCategories.length > 0 &&
    data &&
    data.categories &&
    selectedFiltersNotVisible(selectedCategories, data.categories);

  return (
    <div>
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
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setHideFilters(true);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close filter panel"
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
              selectedCategories={selectedCategories}
              setSelectedCategories={onCategoryChange}
              architectures={getArchitectures()}
              selectedArchitecture={searchParams.get("architecture") || ""}
              setSelectedArchitecture={onArchitectureChange}
              disabled={disabled}
              order={CATEGORY_ORDER}
            />
          )}
        </div>
      </div>
    </div>
  );
};
