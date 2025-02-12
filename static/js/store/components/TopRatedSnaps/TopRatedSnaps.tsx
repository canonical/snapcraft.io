import { ReactNode } from "react";
import { Row, Col, Strip } from "@canonical/react-components";

import { useTopRatedSnaps } from "../../hooks";

import type { Package } from "../../types";

function TopRatedSnaps(): ReactNode {
  const { data, isLoading } = useTopRatedSnaps();

  return (
    <>
      <h2>Top rated snaps</h2>
      <Strip shallow className="u-no-padding--bottom">
        <Row>
          {!isLoading &&
            data &&
            data
              .filter((d: Package, i: number) => i < 6)
              .map((packageData: Package, index: number) => (
                <Col size={4} key={packageData.package.name}>
                  <div style={{ display: "flex" }}>
                    <p className="p-heading--4" style={{ marginRight: "1rem" }}>
                      {index + 1}
                    </p>
                    <div className="p-media-object">
                      <img
                        className="p-media-object__image"
                        src={packageData.package.icon_url}
                        alt={packageData.package.display_name}
                      />
                      <div className="p-media-object__details">
                        <h3
                          className="p-media-object__title u-truncate"
                          title={packageData.package.display_name}
                        >
                          {packageData.package.display_name}
                        </h3>
                        {packageData.publisher && (
                          <p className="u-text--muted">
                            <em>{packageData.publisher.display_name}</em>
                            {packageData.publisher.validation === "verified" ? (
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
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
        </Row>
      </Strip>
    </>
  );
}

export default TopRatedSnaps;
