import { useAtomValue } from "jotai";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { Row, Col, Icon } from "@canonical/react-components";

import { useSerialLog } from "../../hooks";
import { brandIdState, brandStoreState } from "../../state/brandStoreState";
import { setPageTitle } from "../../utils";

import type { UseQueryResult } from "react-query";
import type { SerialLog as SerialLogType } from "../../types/shared";

function SerialLog() {
  const { id, modelId, serial } = useParams();
  const brandId = useAtomValue(brandIdState);
  const { isLoading, isError, data }: UseQueryResult<SerialLogType[], Error> =
    useSerialLog(brandId, modelId, serial);
  const brandStore = useAtomValue(brandStoreState(id));

  brandStore
    ? setPageTitle(`Serial logs for ${modelId} in ${brandStore.name}`)
    : setPageTitle("Serial logs");

  return (
    <>
      <h1>{serial}</h1>
      {isLoading && (
        <p>
          <Icon name="spinner" className="u-animation--spin" />
          &nbsp;Fetching serial logs...
        </p>
      )}
      {!isLoading && !isError && data && (
        <>
          <Row>
            <Col size={4}>
              <p>Serial:</p>
            </Col>
            <Col size={8}>
              <p>{data[0].serial}</p>
            </Col>
          </Row>
          <Row>
            <Col size={4}>
              <p>Created at:</p>
            </Col>
            <Col size={8}>
              <p>
                {format(
                  new Date(data[0]["created-at"]),
                  "dd/MM/yyyy 'at' HH:mm",
                )}
              </p>
            </Col>
          </Row>
          <Row>
            <Col size={4}>
              <p>serial-sign-key-sha3-384:</p>
            </Col>
            <Col size={8}>
              <p>{data[0]["serial-sign-key-sha3-384"]}</p>
            </Col>
          </Row>
          <Row>
            <Col size={4}>
              <p>Serial assertion:</p>
            </Col>
          </Row>
          <pre>{data[0]["serial-assertion"]}</pre>
        </>
      )}
    </>
  );
}

export default SerialLog;
