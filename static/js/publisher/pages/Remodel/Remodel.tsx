import { useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { useParams, useSearchParams } from "react-router-dom";
import { Notification, Icon, Row, Col } from "@canonical/react-components";

import { useRemodels } from "../../hooks";
import {
  filteredRemodelsListState,
  remodelsListFilterState,
  remodelsListState,
} from "../../state/remodelsState";
import { policiesListState } from "../../state/policiesState";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";
import { setPageTitle, getPolicies } from "../../utils";

import Filter from "../../components/Filter";
import RemodelTable from "./RemodelTable";

import type { UseQueryResult } from "react-query";
import type { Remodel } from "../../types/shared";

function Remodel(): React.JSX.Element {
  const { id } = useParams();
  const brandId = useAtomValue(brandIdState);
  const { isLoading, isError, error, data }: UseQueryResult<Remodel[], Error> =
    useRemodels(brandId);
  const setRemodels = useSetAtom(remodelsListState);
  const setPolicies = useSetAtom(policiesListState);
  const setFilter = useSetAtom(remodelsListFilterState);
  const brandStore = useAtomValue(brandStoreState(id));
  const [searchParams] = useSearchParams();

  brandStore
    ? setPageTitle(`Remodels in ${brandStore.name}`)
    : setPageTitle("Remodels");

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    if (!isLoading && !isError && data) {
      const modelIds = [...new Set(data.map((r) => r["to-model"]))];
      setRemodels(data);
      setFilter(searchParams.get("filter") || "");
      getPolicies({ modelIds, id, setPolicies, signal });
    }

    return () => {
      controller.abort();
    };
  }, [isLoading, error, data, brandId, id]);

  return (
    <>
      <div className="u-fixed-width u-flex-column u-flex-grow">
        {isError && error && (
          <Notification severity="negative">
            Error: {error.message}
          </Notification>
        )}
        {isLoading ? (
          <p>
            <Icon name="spinner" className="u-animation--spin" />
            &nbsp;Fetching signing keys...
          </p>
        ) : (
          <>
            <Row>
              <Col size={6}>
                <Filter
                  state={remodelsListFilterState}
                  label="Search remodels"
                  placeholder="Search remodels"
                />
              </Col>
            </Row>
            <div className="u-flex-column u-flex-grow">
              <RemodelTable />
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Remodel;
