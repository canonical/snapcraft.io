import { ReactNode } from "react";
import { Row, Col } from "@canonical/react-components";

function Blog(): ReactNode {
  return (
    <Row>
      <Col size={4}>
        <div
          style={{
            backgroundColor: "#2c2c2c",
            color: "#fff",
            padding: "40px",
            display: "flex",
            height: "100%",
            alignItems: "center",
          }}
        >
          <div>
            <h3>Be part of the community</h3>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin ut
              tempus ante, cut porttitor nbh.
            </p>
            <p>
              <a className="is-dark" href="https://forum.snapcraft.io/">
                Go to community
              </a>
            </p>
          </div>
        </div>
      </Col>
      <Col size={4}>
        <img
          src="https://ubuntu.com/wp-content/uploads/bbb2/image.jpeg"
          alt=""
        />
        <h4>
          <a href="/blog">Creating Snaps on Ubuntu Touch</a>
        </h4>
        <p>
          Tablets, phones and current technology’s capabilities are phenomenal.
          Who would have thought a thin, light, barely 10 inch device would
          provide all the power necessary to run Virtual Machines, wherever one
          desires while powered on battery?
        </p>
        <p className="u-text-muted">
          <em>by Aaron Prisk on 3 April 2024</em>
        </p>
      </Col>
      <Col size={4}>
        <img
          src="https://ubuntu.com/wp-content/uploads/bbb2/image.jpeg"
          alt=""
        />
        <h4>
          <a href="/blog">Creating Snaps on Ubuntu Touch</a>
        </h4>
        <p>
          Tablets, phones and current technology’s capabilities are phenomenal.
          Who would have thought a thin, light, barely 10 inch device would
          provide all the power necessary to run Virtual Machines, wherever one
          desires while powered on battery?
        </p>
        <p className="u-text-muted">
          <em>by Aaron Prisk on 3 April 2024</em>
        </p>
      </Col>
    </Row>
  );
}

export default Blog;
