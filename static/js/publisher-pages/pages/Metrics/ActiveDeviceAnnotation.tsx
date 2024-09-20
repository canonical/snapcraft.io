import { Row, Col } from "@canonical/react-components";
import useMetricsAnnotation from "../../hooks/useMetricsAnnotation";

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

function ActiveDeviceAnnotation({ snapId }: { snapId?: string }): JSX.Element {
  const { data: annotation }: { data: IActiveDeviceAnnotation | undefined } =
    useMetricsAnnotation(snapId);

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
