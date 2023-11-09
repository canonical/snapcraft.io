import React, { useEffect } from "react";
import { Row, Col } from "@canonical/react-components";
import { useSetRecoilState } from "recoil";
import { useParams, useSearchParams } from "react-router-dom";

import { useSnaps } from "../../hooks";
import { snapsListFilterState, snapsListState } from "../../atoms";

import SectionNav from "../SectionNav";
import SnapsFilter from "./SnapsFilter";
import SnapsTable from "./SnapsTable";

import type { Snap } from "../../types/shared";

function Snaps() {
  const { id } = useParams();
  const { isLoading, error, data }: any = useSnaps(id);
  const setSnapsList = useSetRecoilState<Array<Snap>>(snapsListState);
  const setFilter = useSetRecoilState<string>(snapsListFilterState);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!isLoading && !error) {
      setSnapsList(data);
      setFilter(searchParams.get("filter") || "");
    }
  }, [isLoading, error, data]);

  return (
    <main className="l-main">
      <div className="p-panel u-flex-column">
        <div className="p-panel__content u-flex-column u-flex-grow">
          <div className="u-fixed-width">
            <SectionNav sectionName="snaps" />
          </div>
          <Row>
            <Col size={6}>
              <SnapsFilter />
            </Col>
          </Row>
          <div className="u-fixed-width u-flex-column">
            <div className="u-flex-column u-flex-grow">
              <SnapsTable />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Snaps;
