import { ReactNode } from "react";
import { Row, Col, Strip } from "@canonical/react-components";

import { useOrderedSnaps } from "../../hooks";

type Props = {
  category: string;
  title: string;
};

type Package = {
  details: {
    name: string;
    title: string;
    icon: string;
    developer_validation: string;
    publisher: string;
  };
};

function SnapsOrderedList({ category, title }: Props): ReactNode {
  const { data, isLoading } = useOrderedSnaps(category);

  return (
    <>
      <h2>{title}</h2>
      <Strip shallow className="u-no-padding--bottom">
        <Row>
          {!isLoading &&
            data &&
            data
              .filter((_d: Package, i: number) => i < 6)
              .map((packageData: Package, index: number) => (
                <Col size={4} key={packageData.details.name}>
                  <div style={{ display: "flex" }}>
                    <p className="p-heading--4" style={{ marginRight: "1rem" }}>
                      {index + 1}
                    </p>
                    <div className="p-media-object">
                      <a href={`/${packageData.details.name}`}>
                        <img
                          className="p-media-object__image"
                          src={packageData.details.icon}
                          alt={packageData.details.title}
                        />
                      </a>
                      <div className="p-media-object__details">
                        <h3
                          className="p-media-object__title u-truncate"
                          title={packageData.details.title}
                        >
                          <a href={`/${packageData.details.name}`}>
                            {packageData.details.title}
                          </a>
                        </h3>
                        <p className="u-text--muted">
                          <em>{packageData.details.publisher}</em>
                          {packageData.details.developer_validation ===
                          "verified" ? (
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
                  </div>
                </Col>
              ))}
        </Row>
      </Strip>
    </>
  );
}

export default SnapsOrderedList;
