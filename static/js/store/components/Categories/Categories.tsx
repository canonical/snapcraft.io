import { ReactNode } from "react";
import { Row, Col, Strip } from "@canonical/react-components";

import { useCategories } from "../../hooks";

import type { Category } from "../../types";

function Categories(): ReactNode {
  const { data, isLoading } = useCategories();

  return (
    <>
      <h2>Categories</h2>
      {!isLoading && data && (
        <Strip shallow className="u-no-padding--bottom">
          <Row>
            {data.map((category: Category) => (
              <Col size={3} key={category.name}>
                <p className="p-heading--4">
                  <a
                    className="p-link--soft"
                    href={`/store?categories=${category.name}&page=1`}
                  >
                    {category.display_name}
                  </a>
                </p>
              </Col>
            ))}
          </Row>
        </Strip>
      )}
    </>
  );
}

export default Categories;
