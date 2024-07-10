import { ReactNode, RefObject } from "react";
import { useSearchParams } from "react-router-dom";
import { Strip, Row, Col } from "@canonical/react-components";

type Props = {
  searchRef: RefObject<HTMLInputElement>;
  searchSummaryRef: RefObject<HTMLDivElement>;
};

function Banner({ searchRef, searchSummaryRef }: Props): ReactNode {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Strip type="dark">
      <Row>
        <Col size={6} className="col-start-large-4">
          <h1 className="p-heading--2">The app store for Linux</h1>
          <form
            className="p-search-box"
            onSubmit={(e) => {
              e.preventDefault();

              if (searchRef.current && searchRef.current.value) {
                searchParams.delete("page");
                searchParams.set("q", searchRef.current.value);
                setSearchParams(searchParams);
              }

              if (searchSummaryRef && searchSummaryRef.current) {
                searchSummaryRef.current.scrollIntoView({
                  behavior: "smooth",
                });
              }
            }}
          >
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
            <button
              type="reset"
              className="p-search-box__reset"
              onClick={() => {
                searchParams.delete("q");
                setSearchParams(searchParams);
              }}
            >
              <i className="p-icon--close">Close</i>
            </button>
            <button type="submit" className="p-search-box__button">
              <i className="p-icon--search">Search</i>
            </button>
          </form>
        </Col>
      </Row>
    </Strip>
  );
}

export default Banner;
