import { useParams, useSearchParams } from "react-router-dom";
import { Row, Col } from "@canonical/react-components";

import { useEffect, useState } from "react";

interface IActiveDeviceAnnotation {
  buckets: string[];
  name: string;
  series: Array<{
    date: string;
    display_date: string;
    display_name: string;
    name: string;
    values: number[];
  }>;
}

function ActiveDeviceAnnotation(): JSX.Element {
  const { snapId } = useParams();
  const [annotation, setAnnotation] = useState<IActiveDeviceAnnotation | null>(
    null
  );

  const fetchActiveDeviceMetric = async () => {
    const response = await fetch(`/${snapId}/metrics/active-device-annotation`);

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    setAnnotation(data);
  };

  useEffect(() => {
    void fetchActiveDeviceMetric();
  }, []);

  return (
    <Row data-js="annotations-hover">
      {annotation
        ? annotation.series.map((category) => (
            <Col size={4} key={category.name}>
              <p
                data-js="annotation-hover"
                data-id={`category-${category.name}`}
              >
                {category.name == "featured" ? (
                  <>
                    ⭐{" "}
                    <small>
                      <b>Featured</b> snap since <b>{category.display_date}</b>
                    </small>
                  </>
                ) : (
                  <>
                    🗂{" "}
                    <small>
                      Added to <b>{category.display_name}</b> in{" "}
                      <b>{category.display_date}</b>
                    </small>
                  </>
                )}
              </p>
            </Col>
          ))
        : null}
    </Row>
  );
}

export default ActiveDeviceAnnotation;
