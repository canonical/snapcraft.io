import { Strip, Row, Col } from "@canonical/react-components";
import { DefaultCard } from "@canonical/store-components";

import { formatCardData } from "../../utils";

import type { RecommendationData } from "../../types";

type Props = {
  snaps: RecommendationData[];
  title: string;
};

function RecommendationsSection({ snaps, title }: Props): JSX.Element {
  return (
    <>
      <Strip shallow className="u-no-padding--bottom">
        <div className="u-fixed-width">
          <h2>{title}</h2>
        </div>
      </Strip>
      <Strip shallow>
        <Row>
          {snaps.map((item: RecommendationData) => (
            <Col
              size={4}
              key={item.details.snap_id}
              style={{ marginBottom: "1.5rem" }}
            >
              <DefaultCard data={formatCardData(item)} />
            </Col>
          ))}
        </Row>
      </Strip>
    </>
  );
}

export default RecommendationsSection;
