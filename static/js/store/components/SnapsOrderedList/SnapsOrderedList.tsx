import { ReactNode } from "react";
import { Row, Col } from "@canonical/react-components";

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
  const selectedSnaps = data ? data.slice(0, 8) : [];

  return (
    <>
      <h2>{title}</h2>
      <Row>
        {!isLoading &&
          selectedSnaps.map((packageData: Package, index: number) => (
            <Col size={3} key={packageData.details.name}>
              <div>
                <p
                  className="p-heading--4"
                  style={{ float: "left", marginRight: "1rem" }}
                >
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
                  <div
                    className="p-media-object__details"
                    style={{ minWidth: "0" }}
                  >
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
    </>
  );
}

export default SnapsOrderedList;
