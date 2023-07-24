import React from "react";
import { useSearchParams } from "react-router-dom";
import { useSetRecoilState } from "recoil";
import { Button, Icon } from "@canonical/react-components";

import { modelsListFilterState } from "../../atoms";

function ModelsFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const setFilter = useSetRecoilState(modelsListFilterState);

  return (
    <div className="p-search-box">
      <label className="u-off-screen" htmlFor="search">
        Search models
      </label>
      <input
        required
        type="search"
        id="search"
        name="search"
        className="p-search-box__input"
        placeholder="Search models"
        autoComplete="off"
        value={searchParams.get("filter") || ""}
        onChange={(e) => {
          if (e.target.value) {
            setSearchParams({ filter: e.target.value });
            setFilter(e.target.value);
          } else {
            setSearchParams();
            setFilter("");
          }
        }}
      />
      <Button
        type="reset"
        className="p-search-box__reset"
        onClick={() => {
          setSearchParams();
          setFilter("");
        }}
      >
        <Icon name="close">Clear filter</Icon>
      </Button>
      <Button type="submit" className="p-search-box__button">
        <Icon name="search">Search</Icon>
      </Button>
    </div>
  );
}

export default ModelsFilter;
