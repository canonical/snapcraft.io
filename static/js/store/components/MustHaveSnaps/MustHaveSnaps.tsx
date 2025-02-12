import { ReactNode } from "react";
import { Row, Col } from "@canonical/react-components";

type Snap = {
  name: string;
  display_name: string;
  icon_url: string;
};

type Props = {
  snaps: Snap[];
  category: string;
  subheading?: string;
  gradientStart?: string;
  gradientEnd?: string;
};

function MustHaveSnaps({
  snaps,
  category,
  subheading,
  gradientStart,
  gradientEnd,
}: Props): ReactNode {
  const mustHaveIconStyle = {
    backgroundColor: "#fff",
    borderRadius: "5px",
    display: "inline-block",
    height: "118px",
    marginLeft: "18px",
    padding: "24px",
    width: "118px",
  };

  return (
    <>
      <div
        style={{
          background: `linear-gradient(45deg, ${gradientStart || "#251755"} 20%, ${gradientEnd || "#69e07c"})`,
          color: "#fff",
        }}
      >
        <Row style={{ padding: "74px 78px" }}>
          <Col size={6} className="u-vertically-center">
            <div>
              <h2 className="p-heading--3">Must-have snaps for {category}</h2>
              {subheading && (
                <p className="p-heading--4 u-no-margin--bottom">
                  Lorem ipsum dolor sit amet, consectetur
                </p>
              )}
            </div>
          </Col>
          <Col size={6} className="u-align--right">
            {snaps.map((snap) => (
              <div style={mustHaveIconStyle} key={snap.name}>
                <a href={`/${snap.name}`}>
                  <img
                    src={snap.icon_url}
                    width="70"
                    height="70"
                    alt={snap.display_name}
                  />
                </a>
              </div>
            ))}
          </Col>
        </Row>
      </div>
    </>
  );
}

export default MustHaveSnaps;
