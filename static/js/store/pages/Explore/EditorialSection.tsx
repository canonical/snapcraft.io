import { Row, Col } from "@canonical/react-components";
import { SlicesData } from "../../types";

type Props = {
  isLoading: boolean;
  slice: SlicesData;
  gradient: "blueGreen" | "purplePink";
};

function EditorialSection({ isLoading, slice, gradient }: Props): JSX.Element {
  const gradients: Record<string, string> = {
    blueGreen: "linear-gradient(45deg, #251755 20%, #69e07c)",
    purplePink: "linear-gradient(45deg, #19224d 20%, #c481d1)",
  };

  return (
    <div className="u-fixed-width">
      <div
        style={{
          background: gradient ? gradients[gradient] : gradients["purplePink"],
          color: "#fff",
        }}
      >
        {!isLoading && (
          <div className="slice-banner">
            <Row>
              <Col size={6} className="u-vertically-center">
                <div>
                  <h2 className="p-heading--3">{slice.slice.name}</h2>
                  <p className="p-heading--4">{slice.slice.description}</p>
                </div>
              </Col>
              <Col size={6} className="slice-icons">
                {slice.snaps.slice(0, 3).map((snap) => (
                  <div className="slice-icon" key={snap.name}>
                    <a href={`/${snap.name}`}>
                      <img
                        src={snap.icon}
                        width={70}
                        height={70}
                        alt={snap.title}
                        title={snap.title}
                      />
                    </a>
                  </div>
                ))}
              </Col>
            </Row>
          </div>
        )}
      </div>
    </div>
  );
}

export default EditorialSection;
