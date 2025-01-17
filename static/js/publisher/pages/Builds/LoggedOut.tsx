import { useParams } from "react-router-dom";
import { Strip, Row, Col } from "@canonical/react-components";

function BuildsDefault() {
  const { snapId } = useParams();

  return (
    <>
      <div className="snapcraft-p-sticky js-sticky-bar">
        <div className="row">
          <ul className="p-inline-list u-no-margin--bottom">
            <li className="p-inline-list__item u-no-margin--right">
              Login to your GitHub account to start building.
            </li>
            <li className="p-inline-list__item">
              <a
                href={`/github/auth?back=/${snapId}/builds`}
                className="p-button--positive u-no-margin--bottom u-float-right"
              >
                <span>Log in </span>
                <i className="p-icon--github-white"></i>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="u-fixed-width">
        <hr className="u-no-margin--bottom" />
      </div>
      <Strip>
        <div className="u-fixed-width u-align--center u-hide--small u-hide--medium">
          <img
            src="https://assets.ubuntu.com/v1/ed6d1c5b-build.snapcraft.hero.svg"
            alt=""
            width="100%"
          />
        </div>
        <Row>
          <Col size={4} className="u-align-text--center">
            <img
              src="https://assets.ubuntu.com/v1/82de77b0-build.snapcraft.hero-01.svg"
              alt=""
              width="343"
              height="288"
              className="u-hide u-show--small"
            />
            <p>
              Start by creating a repo and pushing your code to GitHub. Make
              sure that your repo includes a snapcraft.yaml file.
            </p>
          </Col>
          <Col size={4} className="u-align-text--center">
            <img
              src="https://assets.ubuntu.com/v1/275ddbf9-build.snapcraft.hero-02.svg"
              alt=""
              width="343"
              height="288"
              className="u-hide u-show--small"
            />
            <p>
              Register a name on Snapcraft and attach it to your repo to start
              building. Your snap will be built automatically for all the
              distros.
            </p>
          </Col>
          <Col size={4} className="u-align-text--center">
            <img
              src="https://assets.ubuntu.com/v1/e708bab9-build.snapcraft.hero-03.svg"
              alt=""
              width="343"
              height="288"
              className="u-hide u-show--small"
            />
            <p>
              Release your snap to your users. From here on, all the updates you
              do to your code will trigger automatic builds.
            </p>
          </Col>
        </Row>
      </Strip>
    </>
  );
}

export default BuildsDefault;
