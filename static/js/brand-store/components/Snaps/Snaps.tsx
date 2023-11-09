import React, { useState, useEffect } from "react";
import { Row, Col } from "@canonical/react-components";
import { useSetRecoilState, useRecoilValue } from "recoil";
import {
  Link,
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useSnaps } from "../../hooks";
import { snapsListFilterState, snapsListState } from "../../atoms";

import SectionNav from "../SectionNav";
import SnapsFilter from "./SnapsFilter";
import SnapsTable from "./SnapsTable";
import SnapsSearch from "./SnapsSearch";

import { isClosedPanel, setPageTitle } from "../../utils";

import type { Snap } from "../../types/shared";
import { brandStoreState } from "../../selectors";

function Snaps() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, error, data }: any = useSnaps(id);
  const setSnapsList = useSetRecoilState<Array<Snap>>(snapsListState);
  const setFilter = useSetRecoilState<string>(snapsListFilterState);
  const brandStore = useRecoilValue(brandStoreState(id));
  const [searchParams] = useSearchParams();

  brandStore
    ? setPageTitle(`Snaps in ${brandStore.name}`)
    : setPageTitle("Snaps");

  useEffect(() => {
    if (!isLoading && !error) {
      setSnapsList(data);
      setFilter(searchParams.get("filter") || "");
    }
  }, [isLoading, error, data]);

  return (
    <>
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
              <Col size={6} className="u-align--right">
                <Link className="p-button" to={`/admin/${id}/snaps/include`}>
                  Include snap
                </Link>
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
      <div
        className={`l-aside__overlay ${
          isClosedPanel(location.pathname, "include") ? "u-hide" : ""
        }`}
        onClick={() => {
          navigate(`/admin/${id}/snaps`);
        }}
      ></div>
      <aside
        className={`l-aside ${
          isClosedPanel(location.pathname, "include") ? "is-collapsed" : ""
        }`}
      >
        <SnapsSearch
          storeId={id}
          selectedSnaps={[]}
          setSelectedSnaps={() => false}
          nonEssentialSnapIds={[]}
        />
      </aside>
    </>
  );
}

export default Snaps;
