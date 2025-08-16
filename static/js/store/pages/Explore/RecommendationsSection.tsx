import { Row, Col } from "@canonical/react-components";
import { DefaultCard } from "@canonical/store-components";

import CardsLoader from "./CardsLoader";

import { formatCardData } from "../../utils";

import type { RecommendationData } from "../../types";

type Props = {
  isLoading: boolean;
  snaps: RecommendationData[];
  title: string;
  highlight?: boolean;
};

function RecommendationsSection({
  isLoading,
  snaps,
  title,
  highlight,
}: Props): JSX.Element {
  return (
    <>
      <div className="u-fixed-width">
        <h2>{title}</h2>
      </div>

      {isLoading && <CardsLoader />}

      {!isLoading && (
        <Row>
          {snaps.map((item: RecommendationData) => (
            <Col
              size={4}
              key={item.details.snap_id}
              style={{ marginBottom: "1.5rem" }}
            >
              <DefaultCard
                data={formatCardData(item)}
                highlighted={highlight}
                highlightColor="#0f95a1"
              />
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}

export default RecommendationsSection;
