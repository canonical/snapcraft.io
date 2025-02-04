import { ReactNode } from "react";
import { Row, Col } from "@canonical/react-components";

import { useSlice } from "../../hooks";

type Props = {
  sliceId: string;
  backgroundStyle?: "blueGreen" | "purplePink";
};

type SliceSnap = {
  icon: string;
  name: string;
  title: string;
};

function Slice({ sliceId, backgroundStyle }: Props): ReactNode {
  const { isLoading, data } = useSlice(sliceId);

  const mustHaveIconStyle = {
    backgroundColor: "#fff",
    borderRadius: "5px",
    display: "inline-block",
    height: "118px",
    marginLeft: "18px",
    padding: "24px",
    width: "118px",
  };

  const backgroundStyles = {
    blueGreen: "linear-gradient(45deg, #251755 20%, #69e07c)",
    purplePink: "linear-gradient(45deg, #19224d 20%, #c481d1)",
  } as {
    [key: string]: string;
  };

  const selectedSnaps = data ? data.snaps.slice(0, 3) : [];

  return (
    <>
      <div
        style={{
          background: backgroundStyle
            ? backgroundStyles[backgroundStyle]
            : backgroundStyles.blueGreen,
          color: "#fff",
        }}
      >
        {!isLoading && data && (
          <Row style={{ padding: "74px 78px" }}>
            <Col size={6} className="u-vertically-center">
              <div>
                <h2 className="p-heading--3">
                  Must-have snaps for {data.slice.name}
                </h2>
                <p className="p-heading--4">{data.slice.description}</p>
              </div>
            </Col>
            <Col
              size={6}
              style={{ display: "flex", justifyContent: "flex-end" }}
            >
              {selectedSnaps.map((snap: SliceSnap) => (
                <div style={mustHaveIconStyle} key={snap.name}>
                  <a href={`/${snap.name}`}>
                    <img
                      src={snap.icon}
                      width="70"
                      height="70"
                      alt={snap.title}
                    />
                  </a>
                </div>
              ))}
            </Col>
          </Row>
        )}
      </div>
    </>
  );
}

export default Slice;
