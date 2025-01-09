import { Col, Link, Row } from "@canonical/react-components";

function EmptySnapList() {
  return (
    <>
      <div className="u-fixed-width">
        <h3 className="p-heading--4">Get started&hellip;</h3>
      </div>
      <Row>
        <Col size={6}>
          <h4 className="p-heading--5">Get to know the basics</h4>
          <p>
            Setup and learn more about <code>snapcraft</code> and key concepts
            of the <code>snap</code> format.
          </p>
          <p>
            <Link href="/docs/quickstart-tour" className="p-button">
              Getting started with snaps
            </Link>
          </p>
        </Col>
        <Col size={6}>
          <h4 className="p-heading--5">
            Publish a snap with the tools you know
          </h4>
          <p>
            Electron, Python, Go and many more examples of how to{" "}
            <code>snap</code> an application using familiar languages.
          </p>
          <p>
            <Link href="/docs/build-snaps/languages" className="p-button">
              Choose a language guide
            </Link>
          </p>
        </Col>
      </Row>
      <div className="u-fixed-width">
        <hr />
      </div>
      <div className="u-fixed-width">
        <h3 className="p-heading--4">Need some help?</h3>
      </div>
      <Row>
        <Col size={6}>
          <h4 className="p-heading--5">Snapcraft documentation</h4>
          <p>
            All you need to know about snaps, snapcraft and everything in
            between.
          </p>
          <p>
            <Link href="/docs">Read the docs &rsaquo;</Link>
          </p>
        </Col>
        <Col size={6}>
          <h4 className="p-heading--5">Join the community</h4>
          <p>
            Request features, troubleshoot and generally find all the latest
            talk about snaps, snapd and snapcraft.
          </p>
          <p>
            <Link href="https://forum.snapcraft.io">
              Go to the forum &rsaquo;
            </Link>
          </p>
        </Col>
      </Row>
    </>
  );
}

export default EmptySnapList;
