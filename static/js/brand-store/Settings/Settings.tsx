import React, { ChangeEvent, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import {
  Form,
  Input,
  Row,
  Col,
  Button,
  Spinner,
  Notification,
} from "@canonical/react-components";

import { currentStoreSelector, membersSelector } from "../selectors";
import { fetchMembers } from "../slices/membersSlice";
import { fetchStore } from "../slices/currentStoreSlice";

import NotAuthorized from "../NotAuthorized";
import PasswordToggle from "../shared/PasswordToggle";
import SectionNav from "../SectionNav";

declare global {
  interface Window {
    CSRF_TOKEN: string;
  }
}

interface RootState {
  currentStore: {
    loading: Boolean;
  };

  members: {
    loading: Boolean;
  };
}

interface RouteParams {
  id: string;
}

interface Member {
  current_user: {};
}

function Settings() {
  const currentStore = useSelector(currentStoreSelector);
  const members = useSelector(membersSelector);
  const storeLoading = useSelector(
    (state: RootState) => state.currentStore.loading
  );
  const membersLoading = useSelector(
    (state: RootState) => state.members.loading
  );
  const dispatch = useDispatch();
  const { id } = useParams<RouteParams>();

  const [isPrivateStore, setIsPrivateStore] = useState(true);
  const [manualReviewPolicy, setManualReviewPolicy] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [currentMember, setCurrentMember] = useState({ roles: Array() });

  const handleFormSubmit = (e: ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSaving(true);

    const settingsData = new FormData();
    settingsData.set("csrf_token", window.CSRF_TOKEN);
    settingsData.set("store-id", id);
    settingsData.set("private", isPrivateStore.toString());
    settingsData.set("manual-review-policy", manualReviewPolicy);

    fetch(`/admin/store/${id}/settings`, {
      method: "POST",
      body: settingsData,
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw Error();
        }
      })
      .then((data) => {
        dispatch(fetchStore(id));

        // Add timeout so that the user has time to notice the save action
        // in the event of it happening very fast
        setTimeout(() => {
          setIsSaving(false);

          if (data.success) {
            setShowSuccessNotification(true);
          }

          if (data.error) {
            setShowErrorNotification(true);
          }
        }, 1500);
      })
      .catch(() => {
        setShowErrorNotification(true);
        setIsSaving(false);
      });
  };

  const handleCheckboxChange = () => {
    setIsPrivateStore(!isPrivateStore);
  };

  const handleRadioButtonChange = (e: ChangeEvent<HTMLInputElement>) => {
    setManualReviewPolicy((e.target as HTMLInputElement).value);
  };

  const getDisabledState = () => {
    return (
      isPrivateStore === currentStore.private &&
      manualReviewPolicy === currentStore["manual-review-policy"]
    );
  };

  const isAdmin = () => currentMember.roles.includes("admin");

  useEffect(() => {
    dispatch(fetchMembers(id));
    dispatch(fetchStore(id));
  }, [id]);

  useEffect(() => {
    setIsPrivateStore(currentStore.private);
    setManualReviewPolicy(currentStore["manual-review-policy"]);
  }, [currentStore.private, currentStore["manual-review-policy"]]);

  useEffect(() => {
    setCurrentMember(members.find((member: Member) => member.current_user));
  }, [members, storeLoading, membersLoading]);

  return (
    <main className="l-main">
      <div className="p-panel--settings">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <SectionNav sectionName="settings" />
          </div>
          {storeLoading && membersLoading && !isSaving ? (
            <div className="u-fixed-width">
              <Spinner text="Loading&hellip;" />
            </div>
          ) : (
            currentMember?.roles &&
            (!isAdmin() ? (
              <NotAuthorized />
            ) : (
              <Row>
                <Col size={7}>
                  {showSuccessNotification && (
                    <Notification
                      severity="positive"
                      title="Success"
                      onDismiss={() => setShowSuccessNotification(false)}
                    >
                      Settings have been updated
                    </Notification>
                  )}
                  {showErrorNotification && (
                    <Notification
                      severity="negative"
                      title="Error"
                      onDismiss={() => setShowErrorNotification(false)}
                    >
                      Something went wrong.{" "}
                      <a href="https://github.com/canonical-web-and-design/snapcraft.io/issues/new">
                        Report a bug
                      </a>
                      .
                    </Notification>
                  )}
                  <Form onSubmit={handleFormSubmit} autoComplete="off">
                    <Input
                      id="is_public"
                      label="Include this store in public lists"
                      type="checkbox"
                      help="This store will not be listed in the store dropdowns like the one in the snap name registration form."
                      onChange={handleCheckboxChange}
                      checked={!isPrivateStore}
                    />

                    <PasswordToggle
                      value={currentStore.id}
                      readOnly={true}
                      label="Store ID"
                      id="store-id"
                    />

                    <h2 className="p-heading--4" id="store-id-label">
                      Manual review policy
                    </h2>
                    <Input
                      type="radio"
                      label="Allow"
                      help="Normal review behaviour will be applied, using the result from the automatic review tool checks."
                      name="manual-review-policy"
                      id="manual-review-policy-label-allow"
                      aria-labelledby="store-id-label"
                      value="allow"
                      onChange={handleRadioButtonChange}
                      checked={manualReviewPolicy === "allow"}
                    />
                    <Input
                      type="radio"
                      label="Avoid"
                      help="No snap will be left in the manual review queue, even if the automatic review tool found no issues."
                      name="manual-review-policy"
                      id="manual-review-policy-label-avoid"
                      value="avoid"
                      onChange={handleRadioButtonChange}
                      checked={manualReviewPolicy === "avoid"}
                    />
                    <Input
                      type="radio"
                      label="Require"
                      help="Every snap will be moved to the review queue, even if the automatic review tool found no issues."
                      name="manual-review-policy"
                      id="manual-review-policy-label-require"
                      value="require"
                      onChange={handleRadioButtonChange}
                      checked={manualReviewPolicy === "require"}
                    />

                    <hr />

                    <div className="u-align--right">
                      <Button
                        appearance="positive"
                        type="submit"
                        disabled={getDisabledState() || isSaving}
                        className={isSaving ? "has-icon" : ""}
                      >
                        {isSaving ? (
                          <>
                            <i className="p-icon--spinner is-light u-animation--spin"></i>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>Save changes</>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Col>
              </Row>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

export default Settings;
