import { useSearchParams } from "react-router-dom";
import { RecoilState, useSetRecoilState } from "recoil";
import { Button, Icon } from "@canonical/react-components";
import { ReactNode } from "react";

type Props = {
  state: RecoilState<string>;
  label: string;
  placeholder: string;
};

function Filter({ state, label, placeholder }: Props): ReactNode {
  const [searchParams, setSearchParams] = useSearchParams();
  const setFilter = useSetRecoilState(state);

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
