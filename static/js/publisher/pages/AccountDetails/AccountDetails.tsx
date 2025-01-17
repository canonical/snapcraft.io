import { useState, useEffect, SyntheticEvent, ReactNode } from "react";
import { useRecoilValue } from "recoil";
import {
  Row,
  Col,
  Icon,
  CheckboxInput,
  Button,
  Notification,
} from "@canonical/react-components";

import Navigation from "../../components/Navigation";

import { publisherState } from "../../state/publisherState";

function AccountDetails(): ReactNode {
  const [subscriptionPreferencesChanged, setSubscriptionPreferencesChanged] =
    useState(false);
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const publisher = useRecoilValue(publisherState);

  useEffect(() => {
    setSubscribeToNewsletter(
      publisher?.subscriptions ? publisher?.subscriptions?.newsletter : false,
    );
  }, [publisher]);

  const hasChanged = (checkedState: boolean) => {
    if (!publisher?.subscriptions && !checkedState) {
      return false;
    }

    if (!publisher?.subscriptions && checkedState) {
      return true;
    }

    if (publisher?.subscriptions?.newsletter !== checkedState) {
      return true;
    }

    return false;
  };

  const isChecked = () => {
    if (!publisher) {
      return false;
    }

    if (publisher?.subscriptions?.newsletter) {
      return true;
    }

    return false;
  };

  return (
    <div className="l-application" role="presentation">
      <Navigation sectionName={"account"} />
      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__content">
            <div className="u-fixed-width">
              {showSuccessMessage && (
                <Notification
                  severity="positive"
                  title="Success"
                  onDismiss={() => {
                    setShowSuccessMessage(false);
                  }}
                >
                  Changes applied successfully
                </Notification>
              )}

              {showErrorMessage && (
                <Notification
                  severity="negative"
                  title="Error"
                  onDismiss={() => {
                    setShowErrorMessage(false);
                  }}
                >
                  There was an error, please try again
                </Notification>
              )}
            </div>

            {!publisher ? (
              <div className="u-fixed-width">
                <Icon name="spinner" className="u-animation--spin" />
                &nbsp;Loading...
              </div>
            ) : (
              <>
                <Row>
                  <Col size={6}>
                    <h2 className="p-heading--4">Account details</h2>
                  </Col>
                  <Col size={6} className="u-align--right">
                    <a
                      className="p-button has-icon"
                      href="https://login.ubuntu.com"
                    >
                      <Icon name="edit" />
                      <span>Edit details</span>
                    </a>
                  </Col>
                </Row>
                <Row>
                  <Col size={3}>
                    <p>Full name</p>
                  </Col>
                  <Col size={3}>
                    <p>{publisher && publisher?.fullname}</p>
                  </Col>
                  <Col size={6}>
                    <p className="u-text-muted">
                      Who your users will see as the publisher of your snap.
                    </p>
                  </Col>
                </Row>
                <div className="u-fixed-width">
                  <hr />
                </div>
                <Row>
                  <Col size={3}>
                    <p>Username</p>
                  </Col>
                  <Col size={3}>
                    <p>{publisher && publisher?.nickname}</p>
                  </Col>
                  <Col size={6}>
                    <p className="u-text-muted">
                      This is a shorthand version of your name, used when space
                      on screen is limited.
                    </p>
                  </Col>
                </Row>
                <div className="u-fixed-width">
                  <hr />
                </div>
                <Row>
                  <Col size={3}>
                    <p>Email address</p>
                  </Col>
                  <Col size={3}>
                    <p>{publisher && publisher?.email}</p>
                  </Col>
                  <Col size={6}>
                    <p className="u-text-muted">
                      Your email address will not be shared publicly.
                    </p>
                  </Col>
                </Row>
                {publisher?.subscriptions && (
                  <>
                    <div className="u-fixed-width">
                      <hr />
                    </div>
                    <Row>
                      <Col size={3}>
                        <p>Email preferences</p>
                      </Col>
                      <Col size={3}>
                        <CheckboxInput
                          label="Blog posts delivered"
                          defaultChecked={isChecked()}
                          onChange={(
                            e: SyntheticEvent<HTMLInputElement> & {
                              target: HTMLInputElement;
                            },
                          ) => {
                            setSubscribeToNewsletter(e.target.checked);
                            setSubscriptionPreferencesChanged(
                              hasChanged(e.target.checked),
                            );
                          }}
                        />
                      </Col>
                      <Col size={6}>
                        <p className="u-text-muted">
                          Get our latest and greatest blog posts delivered to
                          your inbox.
                        </p>
                        <hr />
                        <p className="u-text-muted">
                          Please note, you will still recieve required platform
                          related emails such as registration of snap names, the
                          review status of a snap or any security
                          vulnerabilities.
                        </p>
                      </Col>
                    </Row>
                    <div className="u-fixed-width">
                      <hr />
                    </div>
                    <div className="u-fixed-width">
                      <Button
                        appearance="positive"
                        className="has-icon"
                        disabled={!subscriptionPreferencesChanged || isSaving}
                        onClick={async () => {
                          setShowSuccessMessage(false);
                          setShowErrorMessage(false);
                          setIsSaving(true);

                          const data = new FormData();

                          data.set("csrf_token", window.CSRF_TOKEN);
                          data.set("email", publisher?.email || "");
                          data.set(
                            "newsletter",
                            subscribeToNewsletter ? "on" : "",
                          );

                          const response: Response = await fetch(
                            "/account/publisher",
                            {
                              method: "POST",
                              body: data,
                            },
                          );

                          if (!response.ok) {
                            setShowErrorMessage(true);
                            setIsSaving(false);
                            throw new Error(
                              "There has been a problem saving newsletter preferences",
                            );
                          }

                          const responseData = await response.json();

                          if (responseData.success) {
                            setShowSuccessMessage(true);
                            setIsSaving(false);
                          } else {
                            setShowErrorMessage(true);
                            setIsSaving(false);
                            throw new Error(responseData.message);
                          }
                        }}
                      >
                        {isSaving && (
                          <Icon
                            name="spinner"
                            className="u-animation--spin is-light"
                          />
                        )}
                        <span>Save email preferences</span>
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AccountDetails;
