import { useRef } from "react";

import Banner from "../../components/Banner";

function Explore(): React.JSX.Element {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const searchSummaryRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <Banner searchRef={searchRef} searchSummaryRef={searchSummaryRef} />
    </>
  );
}

export default Explore;
