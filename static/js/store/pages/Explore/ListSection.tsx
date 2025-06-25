import { Row, Col } from "@canonical/react-components";

import CardsLoader from "./CardsLoader";

import type { RecommendationData } from "../../types";

type Props = {
  isLoading: boolean;
  snaps: RecommendationData[];
  title: string;
};

function ListSection({ isLoading, snaps, title }: Props): JSX.Element {
  return (
    <>
      <div className="u-fixed-width">
        <h2>{title}</h2>
      </div>

      {isLoading && <CardsLoader />}

      {!isLoading && (
        <Row>
          {snaps.map((item: RecommendationData, index: number) => (
            <Col
              size={4}
              key={item.details.snap_id}
              style={{ marginBottom: "1.5rem" }}
            >
              <p
                className="p-heading--4"
                style={{ float: "left", marginRight: "1rem" }}
              >
                {index + 1}
              </p>
              <div className="p-media-object">
                <a href={`/${item.details.name}`}>
                  <img
                    className="p-media-object__image"
                    src={item.details.icon}
                    alt={item.details.title}
                  />
                </a>
                <div
                  className="p-media-object__details"
                  style={{ minWidth: "0" }}
                >
                  <h3
                    className="p-media-object__title u-truncate"
                    title={item.details.title}
                  >
                    <a href={`/${item.details.name}`}>{item.details.title}</a>
                  </h3>
                  <p className="u-text--muted">
                    <em>{item.details.publisher}</em>
                    {item.details.developer_validation === "verified" ? (
                      <>
                        {" "}
                        <img
                          src="https://assets.ubuntu.com/v1/ba8a4b7b-Verified.svg"
                          width="14"
                          height="14"
                          alt="Verified account"
                          title="Verified account"
                          className="sc-package-publisher-icon"
                        />
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}

export default ListSection;
