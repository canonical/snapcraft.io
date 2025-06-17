import { useRef, ReactNode } from "react";
import { Strip, Row, Col } from "@canonical/react-components";

import Banner from "../../components/Banner";
import Slice from "../../components/Slice";
import SnapsOrderedList from "../../components/SnapsOrderedList";
import RecentSnaps from "../../components/RecentSnaps";
import Categories from "../../components/Categories";

function Explore(): ReactNode {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchSummaryRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Banner searchRef={searchRef} searchSummaryRef={searchSummaryRef} />

      <Strip>
        <Slice sliceId="featured" backgroundStyle="purplePink" />
      </Strip>

      <Strip shallow className="u-no-padding--top">
        <SnapsOrderedList title="Trending snaps" category="trending" />
      </Strip>

      <Strip shallow className="u-no-padding--top">
        <Categories />
      </Strip>

      <Strip>
        <Slice sliceId="luke's_amazing_slice" backgroundStyle="blueGreen" />
      </Strip>

      <Strip shallow className="u-no-padding--top">
        <SnapsOrderedList title="Most popular snaps" category="popular" />
      </Strip>

      <Strip shallow>
        <RecentSnaps title="Recently updated" />
      </Strip>

      <Strip className="u-no-padding--top">
        <div
          style={{
            backgroundImage:
              "url('https://assets.ubuntu.com/v1/e888a79f-suru.png')",
            backgroundPosition: "top right",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundColor: "#f3f3f3",
            padding: "67px",
          }}
        >
          <Row>
            <Col size={6}>
              <h2>Learn how to snap in 30 minutes</h2>
              <p className="p-heading--4">
                Find out how to build and publish snaps
              </p>
              <a className="p-button--positive" href="/docs/get-started">
                Get started
              </a>
            </Col>
          </Row>
        </div>
      </Strip>
    </>
  );
}

export default Explore;
