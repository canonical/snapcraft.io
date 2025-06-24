import { Row, Col } from "@canonical/react-components";
import { DefaultCard, BundleCard } from "@canonical/store-components";

import CardsLoader from "./CardsLoader";

import { formatCardData } from "../../utils";

import type { RecommendationData } from "../../types";

type Props = {
  isLoading: boolean;
  snaps: RecommendationData[];
  title: string;
  cardType?: string;
};

function RecommendationsSection({
  isLoading,
  snaps,
  title,
  cardType,
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
              {cardType && cardType === "bundle" ? (
                <BundleCard data={formatCardData(item)} />
              ) : (
                <DefaultCard data={formatCardData(item)} />
              )}
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}

export default RecommendationsSection;
