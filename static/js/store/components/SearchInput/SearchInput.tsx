import { Button } from "@canonical/react-components";
import { RefObject } from "react";
import { useSearchParams } from "react-router-dom";

type Props = {
  searchRef: RefObject<HTMLInputElement>;
  searchSummaryRef?: RefObject<HTMLDivElement>;
};

export const SearchInput = ({
  searchRef,
  searchSummaryRef,
}: Props): React.JSX.Element => {
  const [searchParams, setSearchParams] = useSearchParams();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchRef?.current && searchRef.current.value) {
      searchParams.delete("page");
      searchParams.set("q", searchRef.current.value);
      setSearchParams(searchParams);
    }
    if (searchSummaryRef && searchSummaryRef.current) {
      searchSummaryRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  };

  const onReset = () => {
    searchParams.delete("q");
    setSearchParams(searchParams);
  };

  return (
    <form className="p-search-box" onSubmit={onSubmit}>
      <label className="u-off-screen" htmlFor="search">
        Search Snapcraft
      </label>
      <input
        type="search"
        id="search"
        className="p-search-box__input"
        name="q"
        placeholder="Search Snapcraft"
        defaultValue={searchParams.get("q") || ""}
        ref={searchRef}
      />
      <Button type="reset" className="p-search-box__reset" onClick={onReset}>
        <i className="p-icon--close">Close</i>
      </Button>
      <Button type="submit" className="p-search-box__button">
        <i className="p-icon--search">Search</i>
      </Button>
    </form>
  );
};
