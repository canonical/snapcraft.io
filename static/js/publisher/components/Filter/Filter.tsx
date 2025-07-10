import { useSearchParams } from "react-router-dom";
import { useSetAtom as useSetJotaiState } from "jotai";
import { Button, Icon } from "@canonical/react-components";

import type { PrimitiveAtom } from "jotai";

type Props = {
  state: PrimitiveAtom<string>;
  label: string;
  placeholder: string;
};

function Filter({ state, label, placeholder }: Props): React.JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const setFilter = useSetJotaiState(state);

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
        <Icon name="close">Clear filter</Icon>
      </Button>
      <Button type="submit" className="p-search-box__button">
        <Icon name="search">Search</Icon>
      </Button>
    </div>
  );
}

export default Filter;
