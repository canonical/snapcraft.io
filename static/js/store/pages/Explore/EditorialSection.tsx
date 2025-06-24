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

  const iconStyle: Record<string, string> = {
    backgroundColor: "#fff",
    borderRadius: "5px",
    display: "inline-block",
    height: "118px",
    marginLeft: "18px",
    padding: "24px",
    width: "118px",
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
          <Row style={{ padding: "74px 78px" }}>
            <Col size={6} className="u-vertially-center">
              <div>
                <h2 className="p-heading--3">{slice.slice.name}</h2>
                <p className="p-heading--4">{slice.slice.description}</p>
              </div>
            </Col>
            <Col
              size={6}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              {slice.snaps.slice(0, 3).map((snap) => (
                <div style={iconStyle} key={snap.name}>
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
        )}
      </div>
    </div>
  );
}

export default EditorialSection;
