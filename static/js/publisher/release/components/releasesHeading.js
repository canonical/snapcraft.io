import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Row, Col, Button } from "@canonical/react-components";

import { setCurrentTrack } from "../actions/currentTrack";
import { closeHistory } from "../actions/history";
import { getTracks } from "../selectors";

import DefaultTrackModifier from "./defaultTrackModifier";
import ReleasesTable from "./releasesTable";

function ReleasesHeading(props) {
  useEffect(() => {
    function adjustAsidePanelHeight() {
      const targetComponent = document.querySelector("#main-content");
      const asidePanel = document.querySelector("#aside-panel");

      if (targetComponent && asidePanel) {
        const targetRect = targetComponent.getBoundingClientRect();
        const targetTop = targetRect.top;
        const targetBottom = targetRect.bottom;
        const viewportHeight = window.innerHeight;

        if (targetBottom > viewportHeight) {
          asidePanel.style.position = "fixed";
          asidePanel.style.top = `${targetTop}px`;
          asidePanel.style.bottom = "0";
        } else {
          asidePanel.style.position = "sticky";
          asidePanel.style.top = `${targetTop}px`;
        }
      }
    }

    adjustAsidePanelHeight();

    window.addEventListener("resize", adjustAsidePanelHeight);
    window.addEventListener("scroll", adjustAsidePanelHeight);

    return () => {
      window.removeEventListener("resize", adjustAsidePanelHeight);
      window.removeEventListener("scroll", adjustAsidePanelHeight);
    };
  }, []);

  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const openSidePanel = () => {
    setSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setSidePanelOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (track) => {
    props.setCurrentTrack(track);
    setIsOpen(false);
  };

  const { tracks, currentTrack, defaultTrack } = props;
  const options = tracks.map((track) => ({ value: track, label: track }));

  return (
    <div>
      <div className="l-application">
        <main className="l-main">
          <div>
            <div className="u-fixed-width">
              <h4 className="p-heading--4">Releases available to install</h4>
            </div>
            <Row>
              <Col size={6}>
                <h5 className="p-strip is-shallow u-no-padding--top u-no-padding--bottom">
                  <label htmlFor="track-dropdown">
                    Track: &nbsp;
                    <div className="track-dropdown">
                      <div className="dropdown-toggle" onClick={handleToggle}>
                        {currentTrack}
                        <i className="p-icon--chevron-down u-float-right"></i>
                      </div>
                      {isOpen && (
                        <div className="dropdown-menu">
                          {options.map((option, index) => (
                            <div
                              key={index}
                              className="dropdown-item"
                              onClick={() => handleSelect(option.value)}
                            >
                              {option.label}
                              {option.value === defaultTrack && (
                                <div className="p-status-label">Default</div>
                              )}
                              {option.value === currentTrack && (
                                <i className="p-icon--task-outstanding u-float-right"></i>
                              )}
                            </div>
                          ))}
                          <div className="track-button">
                            {options.length <= 1 ? (
                              <Button
                                className="p-button has-icon new-track-button"
                                onClick={() => {
                                  openSidePanel();
                                  if (isOpen) {
                                    handleToggle();
                                  }
                                }}
                              >
                                <i className="p-icon--plus"></i>
                                <span>Request track</span>
                              </Button>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </h5>
              </Col>
              <div className="col-6" style={{ marginTop: "0.25rem" }}>
                {<DefaultTrackModifier />}
              </div>
            </Row>
          </div>
          <ReleasesTable />
        </main>
        <div
          className={`l-aside__overlay ${sidePanelOpen ? "" : "u-hide"}`}
          onClick={closeSidePanel}
        ></div>
        <aside
          className={`l-aside ${sidePanelOpen ? "" : "is-collapsed"}`}
          id="aside-panel"
        >
          <div className="p-panel is-flex-column">
            <div className="p-panel__header">
              <h4 className="p-panel__title p-heading--4">REQUEST TRACK</h4>
            </div>
            <div className="p-panel__content u-no-padding--top u-no-padding--bottom u-fixed-width">
              <h5 className="p-heading--5 u-no-margin--bottom">
                <b>What is a track?</b>
              </h5>
              <p>
                A track contains a series of compatible releases. <br />
                For example, you could maintain your &#34;3.x&#34; and
                &#34;4.x&#34; series in different tracks. <br />
                You could also use a track for an LTS release.
              </p>
              <p>
                Every track has risk-levels available (stable, beta, candidate,
                edge).
              </p>
              <p>
                Release to a new track using: <br />
                <code>
                  snapcraft release &lt;snap-name&gt; &lt;revision&gt;
                  &lt;track&gt;/&lt;risk&gt;
                </code>
              </p>
              <p>
                <a href="https://snapcraft.io/docs/channels">
                  Learn about tracks, risk-levels and branches
                </a>
                <br />
                <a href="https://snapcraft.io/docs/publish-to-a-branch">
                  How to make a release
                </a>
              </p>
              <h5 className="p-heading--5 u-no-padding--top u-no-margin--bottom">
                <b>What to expect</b>
              </h5>
              <p>
                After the Forum request, we will be in touch with you to
                validate the track creation guardrails (TCG).
              </p>
              <p>
                After the Admin validation, you will have access to a self-serve
                track creation service.
              </p>
              <h5 className="p-heading--5 u-no-padding--top u-no-margin--bottom">
                <b>Request a new track</b>
              </h5>
              <p className="u-no-padding--bottom">
                To request a new track, follow the link below to go to the
                Snapcraft Forum and open a new topic under the
                &#34;store-requests&#34; category.
              </p>
            </div>
            <div className="aside-panel-footer">
              <div className="p-panel__footer u-align--right">
                <div className="u-fixed-width">
                  <Button
                    className="u-no-margin--bottom"
                    onClick={closeSidePanel}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="u-no-margin--bottom p-button--positive"
                    onClick={() =>
                      window.open(
                        "https://forum.snapcraft.io/c/store-requests",
                        "_blank",
                      )
                    }
                  >
                    Request on Forum
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

ReleasesHeading.propTypes = {
  tracks: PropTypes.array.isRequired,
  setCurrentTrack: PropTypes.func.isRequired,
  closeHistoryPanel: PropTypes.func.isRequired,
  currentTrack: PropTypes.string.isRequired,
  defaultTrack: PropTypes.string,
};

const mapStateToProps = (state) => {
  return {
    tracks: getTracks(state),
    currentTrack: state.currentTrack,
    defaultTrack: state.defaultTrack,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setCurrentTrack: (track) => dispatch(setCurrentTrack(track)),
    closeHistoryPanel: () => dispatch(closeHistory()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ReleasesHeading);
