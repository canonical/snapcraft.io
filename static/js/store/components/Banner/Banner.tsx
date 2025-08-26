import { Strip, Row, Col } from "@canonical/react-components";
import { SearchInput } from "../SearchInput";

import type { RefObject } from "react";

type Props = {
  searchRef: RefObject<HTMLInputElement | null>;
  searchSummaryRef?: RefObject<HTMLDivElement | null>;
};

function Banner({ searchRef, searchSummaryRef }: Props): React.JSX.Element {
  return (
    <Strip type="dark">
      <Row>
        <Col size={6} className="col-start-large-4">
          <h1 className="p-heading--2">The app store for Linux</h1>
          <SearchInput
            searchRef={searchRef}
            searchSummaryRef={searchSummaryRef}
          />
        </Col>
      </Row>
    </Strip>
  );
}

export default Banner;
