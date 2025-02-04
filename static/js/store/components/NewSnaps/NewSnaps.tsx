import { ReactNode } from "react";
import { Row, Col, Strip } from "@canonical/react-components";
import { DefaultCard } from "@canonical/store-components";

import { useNewSnaps } from "../../hooks";

import type { Package } from "../../types";

function NewSnaps(): ReactNode {
  const { data, isLoading } = useNewSnaps();

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <h2>What's new</h2>
        <p>
          <a href="/store">See all</a>
        </p>
      </div>
      {!isLoading && data && (
        <Strip shallow className="u-no-padding--bottom">
          <Row>
            {data
              .filter((d: Package, i: number) => i < 6)
              .map((packageData: Package) => (
                <Col
                  size={4}
                  key={packageData.package.name}
                  style={{ marginBottom: "1.5rem" }}
                >
                  <DefaultCard data={packageData} />
                </Col>
              ))}
          </Row>
        </Strip>
      )}
    </>
  );
}

export default NewSnaps;
