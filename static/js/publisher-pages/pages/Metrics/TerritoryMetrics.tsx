import { useParams } from "react-router-dom";
import { Row, Col, Spinner, CodeSnippet } from "@canonical/react-components";

import { useEffect } from "react";
import { renderTerritoriesMetrics } from "../../../publisher/metrics/metrics";
import useCountryMetrics from "../../hooks/useCountryMetrics";

type ActiveDevice = {
  code: string;
  color_rgb: string;
  name: string;
  number_of_users: number;
  percentage_of_users: number;
};

export const TerritoryMetrics = ({
  isEmpty,
  onDataLoad,
}: {
  isEmpty: boolean;
  onDataLoad: (dataLength: ActiveDevice | undefined) => void;
}): JSX.Element => {
  const { snapId } = useParams();
  const {
    status,
    data: countryInfo,
    isFetching,
  }: {
    status: string;
    data:
      | {
          active_devices: { [key: string]: ActiveDevice };
          territories_total: number;
        }
      | undefined;
    isFetching: boolean;
  } = useCountryMetrics(snapId);

  useEffect(() => {
    if (countryInfo) {
      countryInfo.active_devices &&
        renderTerritoriesMetrics({
          selector: "#territories",
          metrics: countryInfo.active_devices,
        });
      onDataLoad(countryInfo.active_devices?.length);
    }
  }, [countryInfo]);

  return (
    <section className={`p-strip is-shallow ${isEmpty ? "is-empty" : ""}`}>
      <Row>
        <Col size={12} key="activeServices">
          <h1 className="u-float-left p-heading--4">Territories</h1>
          <div className="p-heading--4 u-float-right u-no-margin--top">
            <strong>{countryInfo?.territories_total}</strong>
          </div>
        </Col>
        <Col size={12} key="territoriesSeparator">
          <hr />
        </Col>
        {isFetching ? (
          <Spinner />
        ) : (
          <>
            {isEmpty && <div>No data found.</div>}
            {status === "error" && (
              <CodeSnippet
                blocks={[
                  {
                    code: <div>An error occurred. Please try again.</div>,
                    wrapLines: true,
                  },
                ]}
              />
            )}
          </>
        )}

        <Col size={12} key="territories">
          <div id="territories" className="snapcraft-territories"></div>
        </Col>
      </Row>
    </section>
  );
};
