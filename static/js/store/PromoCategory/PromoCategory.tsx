import { ReactNode } from "react";
import { Row, Col, Strip } from "@canonical/react-components";

function PromoCategory(): ReactNode {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <h2>Everything for your game night</h2>
        <p>
          <a href="/store?categories=games">See all</a>
        </p>
      </div>
      <Strip shallow className="u-no-padding--bottom">
        <Row>
          <Col size={4}>
            <div className="p-card u-no-padding">
              <img
                className="p-card__image"
                src="https://dashboard.snapcraft.io/site_media/appmedia/2018/08/Screenshot_at_2018-08-14_13-05-24.png"
                alt=""
              />
              <div className="p-card__inner">
                <h3 className="p-heading--5 u-no-margin--bottom">Forestopia</h3>
                <p className="u-text-muted u-no-padding--top">
                  <em>Gravity Game Arise</em>
                </p>
                <p>Lorem ipsum dolor sit amet Lorem ipsum dolor sit amet</p>
              </div>
            </div>
          </Col>
          <Col size={4}>
            <div className="p-card u-no-padding">
              <img
                className="p-card__image"
                src="https://dashboard.snapcraft.io/site_media/appmedia/2018/08/Screenshot_at_2018-08-14_13-05-24.png"
                alt=""
              />
              <div className="p-card__inner">
                <h3 className="p-heading--5 u-no-margin--bottom">
                  Anima Revolt Battle Simulator
                </h3>
                <p className="u-text-muted u-no-padding--top">
                  <em>Vdimension</em>
                </p>
                <p>Lorem ipsum dolor sit amet Lorem ipsum dolor sit amet</p>
              </div>
            </div>
          </Col>
          <Col size={4}>
            <div className="p-card u-no-padding">
              <img
                className="p-card__image"
                src="https://dashboard.snapcraft.io/site_media/appmedia/2018/08/Screenshot_at_2018-08-14_13-05-24.png"
                alt=""
              />
              <div className="p-card__inner">
                <h3 className="p-heading--5 u-no-margin--bottom">GRIS</h3>
                <p className="u-text-muted u-no-padding--top">
                  <em>DevolverDigital</em>
                </p>
                <p>Lorem ipsum dolor sit amet Lorem ipsum dolor sit amet</p>
              </div>
            </div>
          </Col>
        </Row>
      </Strip>
    </>
  );
}

export default PromoCategory;
