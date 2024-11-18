import { ReactNode, RefObject } from "react";
import { Strip, Row, Col } from "@canonical/react-components";
import { SearchInput } from "../SearchInput";

type Props = {
  searchRef?: RefObject<HTMLInputElement>;
  searchSummaryRef?: RefObject<HTMLDivElement>;
};

function Banner({ searchRef, searchSummaryRef }: Props): ReactNode {
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
