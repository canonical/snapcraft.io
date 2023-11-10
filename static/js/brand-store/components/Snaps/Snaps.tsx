import React, { useEffect } from "react";
import { Row, Col, Button } from "@canonical/react-components";
import { useSetRecoilState, useRecoilValue } from "recoil";
import {
  Link,
  useParams,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { useMembers, useSnaps } from "../../hooks";

import {
  snapsListFilterState,
  snapsListState,
  brandStoresState,
  membersListState,
} from "../../atoms";
import {
  brandStoreState,
  currentMemberState,
  includedStoresState,
} from "../../selectors";

import SectionNav from "../SectionNav";
import SnapsFilter from "./SnapsFilter";
import SnapsTable from "./SnapsTable";
import SnapsSearch from "./SnapsSearch";

import { isClosedPanel, setPageTitle, getStoreName } from "../../utils";

import type { Snap, Store, Member } from "../../types/shared";

function Snaps() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading, error, data, refetch }: any = useSnaps(id);
  const {
    isLoading: membersLoading,
    error: membersError,
    data: membersData,
    refetch: refetchMembers,
  }: any = useMembers(id);
  const setSnapsList = useSetRecoilState<Array<Snap>>(snapsListState);
  const setFilter = useSetRecoilState<string>(snapsListFilterState);
  const brandStore = useRecoilValue(brandStoreState(id));
  const includedStores = useRecoilValue(includedStoresState);
  const [searchParams] = useSearchParams();
  const brandStores = useRecoilValue<Array<Store>>(brandStoresState);
  const currentMember = useRecoilValue<Member | undefined>(currentMemberState);
  const setMembersList = useSetRecoilState<Array<Member>>(membersListState);

  brandStore
    ? setPageTitle(`Snaps in ${brandStore.name}`)
    : setPageTitle("Snaps");

  useEffect(() => {
    refetch();

    if (!isLoading && !error) {
      setSnapsList(data);
      setFilter(searchParams.get("filter") || "");
    }
  }, [isLoading, error, data, id]);

  useEffect(() => {
    refetchMembers();

    if (!membersLoading && !membersError) {
      setMembersList(membersData);
    }
  }, [membersLoading, membersError, membersData, id]);

  console.log("currentMember", currentMember);

  return (
    <>
      <main className="l-main">
        <div className="p-panel u-flex-column">
          <div className="p-panel__content u-flex-column u-flex-grow">
            {currentMember && currentMember.roles.includes("admin") && (
              <div className="u-fixed-width">
                <SectionNav sectionName="snaps" />
              </div>
            )}
            <Row>
              <Col size={6}>
                <SnapsFilter />
              </Col>
              {currentMember && currentMember.roles.includes("admin") && (
                <Col size={6} className="u-align--right">
                  <Link className="p-button" to={`/admin/${id}/snaps/include`}>
                    Include snap
                  </Link>
                  <Button className="p-button u-no-margin--right">
                    Exclude snap
                  </Button>
                </Col>
              )}
            </Row>
            <div className="u-fixed-width u-flex-column">
              <div className="u-flex-column u-flex-grow">
                <SnapsTable />

                {includedStores && (
                  <>
                    <h4>Fully included stores</h4>
                    <p>
                      In addition to the snaps listed above, all snaps from the
                      following stores are also included in{" "}
                      {getStoreName(id, brandStores)}
                    </p>
                    <ul>
                      {includedStores["included-stores"].map(
                        (includedStore: any) => (
                          <li key={includedStore.id}>
                            {includedStore.name} ({includedStore.id})
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}
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
        <div className="p-panel is-flex-column">
          <div className="p-panel__header">
            <h4 className="p-panel__title">Add a snap to store</h4>
          </div>
          <div className="p-panel__content u-no-padding--top">
            <div className="u-fixed-width">
              <SnapsSearch
                storeId={id}
                selectedSnaps={[]}
                setSelectedSnaps={() => false}
                nonEssentialSnapIds={[]}
              />
            </div>
          </div>
          <div className="p-panel__footer u-align--right">
            <div className="u-fixed-width">
              <Button
                className="u-no-margin--bottom"
                onClick={() => {
                  navigate(`/admin/${id}/snaps`);
                }}
              >
                Cancel
              </Button>
              <Button
                appearance="positive"
                onClick={(e) => {
                  e.preventDefault();
                }}
                className="u-no-margin--bottom u-no-margin--right"
              >
                Add snap
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Snaps;
