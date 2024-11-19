import { Col, Link, List, Row, Strip } from "@canonical/react-components";
import { SearchInput } from "../SearchInput";
import { PackageFilter } from "../PackageFilter";
import { Store } from "../../types";
import { useRef } from "react";

export const EmptyResultSection = ({
  searchTerm,
  data,
  isFetching,
}: {
  searchTerm: string | null;
  data?: Store;
  isFetching: boolean;
}) => {
  const searchRef = useRef<HTMLInputElement | null>(null);

  return (
    <Strip>
      <Row>
        <Col size={3}>
          <PackageFilter data={data} disabled={isFetching} />
        </Col>

        <Col size={9}>
          <Row>
            <Col size={9}>
              <h1 className="p-heading--2">
                Search results for "{searchTerm}"
              </h1>
              <SearchInput searchRef={searchRef} />
            </Col>
          </Row>
          <Row>
            <Col size={4}>
              <h2 className="p-heading--4">
                Why not trying widening your search?
              </h2>
              <p className="p-heading--4">You can do this by:</p>
            </Col>
            <Col size={4}>
              <List
                items={[
                  "Adding alternative words or phrases",
                  "Using individual words instead of phrases",
                  "Trying a different spelling",
                ]}
                ticked
              />
            </Col>
          </Row>

          <Row>
            <Col size={9}>
              <div className="u-fixed-width u-hide--small u-hide--medium">
                <hr className="p-rule" />
              </div>
            </Col>
          </Row>

          <Row>
            <Col size={4}>
              <h2 className="p-heading--4">Still no luck?</h2>
            </Col>
            <Col size={4} className="snap-packages__empty-more-options">
              <List
                items={[
                  <Link
                    href="/store?categories=featured"
                    key={"explore-snaps"}
                    className={"snap-packages__list-item"}
                  >
                    Explore featured snaps
                  </Link>,
                  <Link
                    href="/about/contact-us"
                    key={"contact-us"}
                    className={"snap-packages__list-item"}
                  >
                    Contact us
                  </Link>,
                ]}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </Strip>
  );
};
