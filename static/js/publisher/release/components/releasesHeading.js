import React, { useState } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  Row,
  Col,
  Button,
  Icon,
  Form,
  Notification,
  Accordion,
} from "@canonical/react-components";

import { setCurrentTrack } from "../actions/currentTrack";
import { closeHistory } from "../actions/history";
import { getTracks } from "../selectors";
import {
  validatePhasingPercentage,
  resizeAsidePanel,
  numericalSort,
} from "../helpers";

import DefaultTrackModifier from "./defaultTrackModifier";
import ReleasesTable from "./releasesTable";

function ReleasesHeading(props) {
  resizeAsidePanel(props.tracks);
  const [isOpen, setIsOpen] = useState(false);

  const [requestTrackSidePanelOpen, setRequestTrackSidePanelOpen] =
    useState(false);

  const [addTrackSidePanelOpen, setAddTrackSidePanelOpen] = useState(false);

  const openRequestTrackSidePanel = () => {
    setRequestTrackSidePanelOpen(true);
  };

  const closeRequestTrackSidePanel = () => {
    setRequestTrackSidePanelOpen(false);
  };

  const openAddTrackSidePanel = () => {
    setAddTrackSidePanelOpen(true);
  };

  const closeAddTrackSidePanel = () => {
    setTrackName("");
    setVersionPattern("");
    setPhasingPercentage("");
    setPhasingPercentageError("");
    setTrackNameError("");
    setAddTrackSidePanelOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (track) => {
    props.setCurrentTrack(track);
    setIsOpen(false);
  };

  const { tracks, currentTrack, defaultTrack } = props;
  tracks.sort(numericalSort);
  const options = tracks.map((track) => ({ value: track, label: track }));

  // add new track form

  const [trackName, setTrackName] = useState("");
  const [versionPattern, setVersionPattern] = useState("");
  const [phasingPercentage, setPhasingPercentage] = useState("");
  const [phasingPercentageError, setPhasingPercentageError] = useState("");

  const [isTrackNameFilled, setIsTrackNameFilled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleTrackNameChange = (event) => {
    const { value } = event.target;
    setTrackName(value);
    setIsTrackNameFilled(value.trim().length > 0);
  };

  const handleVersionPatternChange = (event) => {
    setVersionPattern(event.target.value);
  };

  const handlePhasingPercentageChange = (event) => {
    const { value } = event.target;
    setPhasingPercentage(value);
    const error = validatePhasingPercentage(value);
    setPhasingPercentageError(error);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const [successNotification, setSuccessNotification] = useState(null);
  const [trackNameError, setTrackNameError] = useState("");

  const handleAddTrack = async () => {
    try {
      setIsLoading(true);

      const formData = new URLSearchParams();
      formData.append("track-name", trackName);

      if (versionPattern.trim() !== "") {
        formData.append("version-pattern", versionPattern);
      }

      if (phasingPercentage.trim() !== "" && !phasingPercentageError) {
        formData.append("automatic-phasing-percentage", phasingPercentage);
      }

      const response = await fetch(`/${props.snapName}/create-track`, {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        props.setCurrentTrack(trackName);
        closeAddTrackSidePanel();
        setSuccessNotification(`Track ${trackName} created successfully`);
      } else {
        let errorMessage = responseData.error;
        if (responseData && responseData["error-list"]) {
          const error = responseData["error-list"][0];
          if (error && error.message) {
            errorMessage = error.message;
          }
        }
        setTrackNameError(errorMessage);
      }
    } catch (error) {
      console.error("Error:", error.message);
      showNotification("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
                          <div className="options-container">
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
                          </div>
                          <div className="track-button-wrapper">
                            <div className="track-button">
                              {options.length <= 1 ? (
                                <Button
                                  className="p-button has-icon new-track-button"
                                  onClick={() => {
                                    openRequestTrackSidePanel();
                                    if (isOpen) {
                                      handleToggle();
                                    }
                                  }}
                                >
                                  <i className="p-icon--plus"></i>
                                  <span>Request track</span>
                                </Button>
                              ) : (
                                <Button
                                  className="p-button has-icon new-track-button"
                                  onClick={() => {
                                    openAddTrackSidePanel();
                                    if (isOpen) {
                                      handleToggle();
                                    }
                                  }}
                                >
                                  <i className="p-icon--plus"></i>
                                  <span>Add track</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </h5>
                <div className="success-notification">
                  {successNotification && (
                    <Notification severity="positive">
                      {successNotification}
                    </Notification>
                  )}
                </div>
              </Col>
              <div className="col-6" style={{ marginTop: "0.25rem" }}>
                {<DefaultTrackModifier />}
              </div>
            </Row>
          </div>
          <ReleasesTable />
        </main>

        {/* Request track aside panel */}

        <div
          className={`l-aside__overlay ${requestTrackSidePanelOpen ? "" : "u-hide"}`}
          onClick={closeRequestTrackSidePanel}
        ></div>
        <aside
          className={`l-aside ${requestTrackSidePanelOpen ? "" : "is-collapsed"}`}
          id="request-track-aside-panel"
        >
          <div className="p-panel is-flex-column">
            <div className="p-panel__header">
              <h4 className="p-panel__title p-heading--4">REQUEST TRACK</h4>
            </div>
            <div className="p-panel__content u-no-padding--top u-no-padding--bottom u-fixed-width">
              <h5 className="p-heading--5 u-no-margin--bottom">
                What is a track?
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
                What to expect
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
                Request a new track
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
                    onClick={closeAddTrackSidePanel}
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

        {/* Add track aside panel */}

        <div
          className={`l-aside__overlay ${addTrackSidePanelOpen ? "" : "u-hide"}`}
          onClick={closeAddTrackSidePanel}
        ></div>
        <aside
          className={`l-aside ${addTrackSidePanelOpen ? "" : "is-collapsed"}`}
          id="add-track-aside-panel"
        >
          <div className="p-panel is-flex-column">
            <div className="p-panel__header">
              <h4 className="p-panel__title p-heading--4">ADD TRACK</h4>
            </div>
            <div className="p-panel__content u-no-padding--top u-no-padding--bottom u-fixed-width">
              <Form>
                <div>
                  <div
                    className={`p-form__group p-form-validation ${trackNameError ? " is-error" : ""}`}
                  >
                    <label htmlFor="trackName" className="p-form__label">
                      <strong>* Track name</strong>
                    </label>
                    <div className="p-form__control">
                      <input
                        type="text"
                        id="trackName"
                        className="p-form-validation__input"
                        required={true}
                        placeholder="display-name123"
                        aria-invalid="true"
                        aria-describedby="trackName"
                        name="trackName"
                        value={trackName}
                        onChange={handleTrackNameChange}
                      />
                      <p
                        className="p-form-validation__message"
                        id="trackNameErrorMessage"
                      >
                        {trackNameError}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="p-form-help-text" id="trackNameHelpMessage">
                  Name should follow the track creation guardrails (TCG)
                </p>

                {/* Optional Properties */}
                <Accordion
                  className="add-track-accordion"
                  sections={[
                    {
                      key: "optional properties",
                      title: "Optional Properties",
                      content: (
                        <div>
                          <div>
                            <label htmlFor="versionPattern">
                              <strong>Version pattern</strong>
                            </label>
                            <input
                              type="text"
                              id="versionPattern"
                              name="versionPattern"
                              placeholder="?.v.*"
                              value={versionPattern}
                              onChange={handleVersionPatternChange}
                            />
                          </div>
                          <p
                            className="p-form-help-text"
                            id="versionPatternHelpMessage"
                          >
                            Version pattern should follow glob pattern
                          </p>

                          <div
                            className={`p-form__group p-form-validation ${phasingPercentageError ? " is-error" : ""}`}
                          >
                            <label
                              htmlFor="phasingPercentage"
                              className="p-form__label"
                            >
                              <strong>Automatic phasing percentage</strong>
                            </label>
                            <div className="p-form__control">
                              <input
                                type="text"
                                id="phasingPercentage"
                                className="p-form-validation__input"
                                placeholder="10.15"
                                aria-invalid="true"
                                aria-describedby="phasingPercentageErrorMessage"
                                name="phasingPercentage"
                                value={phasingPercentage}
                                onChange={handlePhasingPercentageChange}
                              />
                              <p
                                className="p-form-validation__message"
                                id="phasingPercentageErrorMessage"
                              >
                                {phasingPercentageError}
                              </p>
                            </div>
                          </div>
                          <p
                            className="p-form-help-text"
                            id="phasingPercentageHelpMessage"
                          >
                            The percentage is a value from 0 to 100
                          </p>
                        </div>
                      ),
                    },
                  ]}
                />
              </Form>
              <p>* Mandatory field</p>
              <p>
                <a href="https://snapcraft.io/docs/channels">
                  Learn about tracks
                </a>{" "}
                or <a href="https://discourse.canonical.com/">contact us</a> for
                help.
              </p>
              {notification && (
                <Notification
                  severity={
                    notification.type === "Error" ? "negative" : "positive"
                  }
                >
                  {notification.message}
                </Notification>
              )}
            </div>
            <div className="aside-panel-footer">
              <div className="p-panel__footer u-align--right">
                <div className="u-fixed-width">
                  <Button
                    className="u-no-margin--bottom"
                    onClick={() => {
                      closeAddTrackSidePanel();
                      setNotification(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="u-no-margin--bottom p-button--positive"
                    onClick={() => {
                      handleAddTrack();
                      setNotification(null);
                    }}
                    disabled={
                      !isTrackNameFilled || phasingPercentageError || isLoading
                    }
                  >
                    {isLoading ? (
                      <div>
                        <Icon name="spinner" className="u-animation--spin" />
                        &nbsp;Loading...
                      </div>
                    ) : (
                      <div>Add track</div>
                    )}
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
  snapName: PropTypes.string.isRequired,
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
