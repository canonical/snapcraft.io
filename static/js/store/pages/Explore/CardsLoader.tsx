import { Row, Col } from "@canonical/react-components";
import { LoadingCard } from "@canonical/store-components";
import { v4 as uuidv4 } from "uuid";

function CardsLoader(): JSX.Element {
  const elementIds: string[] = Array.of(
    uuidv4(),
    uuidv4(),
    uuidv4(),
    uuidv4(),
    uuidv4(),
    uuidv4(),
  );

  return (
    <Row>
      {elementIds.map((id) => (
        <Col size={4} key={id}>
          <LoadingCard height={157} />
        </Col>
      ))}
    </Row>
  );
}

export default CardsLoader;
