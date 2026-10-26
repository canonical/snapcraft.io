import { useSearchParams } from "react-router-dom";
import { useSetAtom } from "jotai";
// Still need to use the `Icon` from `react-components`
// until the `IconButton` component is ready in Pragma
import {
  Button,
  Icon as ReactComponentsIcon,
} from "@canonical/react-components";

import type { PrimitiveAtom } from "jotai";

type Props = {
  state: PrimitiveAtom<string>;
  label: string;
  placeholder: string;
};

function Filter({ state, label, placeholder }: Props): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const setFilter = useSetAtom(state);

  return (
    <div className="p-search-box">
      <label className="u-off-screen" htmlFor="search">
        {label}
      </label>
      <input
        required
        type="search"
        id="search"
        name="search"
        className="p-search-box__input"
        placeholder={placeholder}
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
        <ReactComponentsIcon name="close">Clear filter</ReactComponentsIcon>
      </Button>
      <Button type="submit" className="p-search-box__button">
        <ReactComponentsIcon name="search">Search</ReactComponentsIcon>
      </Button>
    </div>
  );
}

export default Filter;
