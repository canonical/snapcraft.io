import React, { ChangeEvent, useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Spinner,
  Accordion,
  Row,
  Col,
  Button,
  SearchBox,
  Input,
  Notification,
} from "@canonical/react-components";

import ROLES from "./memberRoles";

import MembersTable from "./MembersTable";
import InvitesTable from "./InvitesTable";
import StoreNotFound from "../StoreNotFound";
import SectionNav from "../SectionNav";

import {
  membersSelector,
  invitesSelector,
  brandStoresListSelector,
} from "../../selectors";
import { fetchMembers } from "../../slices/membersSlice";
import { fetchInvites } from "../../slices/invitesSlice";

import { setPageTitle } from "../../utils";

import type { InvitesSlice } from "../../types/shared";

type Members = {
  members: {
    members: Array<Member>;
    loading: boolean;
    notFound: boolean;
  };
};

type Member = {
  displayname: string;
  email: string;
  id: string;
  roles: string[];
  username: string;
  current_user: boolean;
};

function Members() {
  const members = useSelector(membersSelector);
  const membersLoading = useSelector((state: Members) => state.members.loading);
  const invites = useSelector(invitesSelector);
  const brandStoresList = useSelector(brandStoresListSelector);
  const invitesLoading = useSelector((state: Members) => state.members.loading);
  const membersNotFound = useSelector(
    (state: Members) => state.members.notFound
  );
  const invitesNotFound = useSelector(
    (state: InvitesSlice) => state.invites.notFound
  );
  const dispatch = useDispatch();
  const { id } = useParams();
  const [filteredMembers, setFilteredMembers]: any = useState([]);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRoles, setNewMemberRoles]: any = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showErrorNotification, setShowErrorNotification] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [storeName, setStoreName]: any = useState("");
  const [memberButtonDisabled, setMemberButtonDisabled] = useState(false);
  const [changedMembers, setChangedMembers] = useState([]);
  const [notificationText, setNotificationText] = useState(
    "Changes have been saved"
  );
  const [currentMember, setCurrentMember]: any = useState(null);

  setPageTitle(`Members in ${storeName}`);

  const handleInvite = (action: string) => {
    setIsSaving(true);

    const memberData = new FormData();
    const member = [
      {
        email: newMemberEmail,
        roles: newMemberRoles,
      },
    ];
    memberData.set("csrf_token", window.CSRF_TOKEN);
    memberData.set("members", JSON.stringify(member));

    fetch(`/admin/store/${id}/${action}`, {
      method: "POST",
      body: memberData,
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw Error();
        }
      })
      .then((data) => {
        // Add timeout so that the user has time to notice the save action
        // in the event of it happening very fast
        setTimeout(() => {
          setIsSaving(false);

          if (data.msg === "invite") {
            setShowInviteForm(true);
          } else {
            setSidePanelOpen(false);
            setNewMemberEmail("");
            setNewMemberRoles([]);
            dispatch(fetchMembers(id as string) as any);
            dispatch(fetchInvites(id as string) as any);
            setShowSuccessNotification(true);
            setNotificationText("Member has been added to the store");
            setShowInviteForm(false);

            setTimeout(() => {
              setShowSuccessNotification(false);
            }, 5000);
          }
        }, 1500);
      })
      .catch(() => {
        setIsSaving(false);
        setShowErrorNotification(true);

        setTimeout(() => {
          setShowErrorNotification(false);
        }, 5000);
      });
  };

  const handleRoleChange = (e: ChangeEvent) => {
    const role = e.target.id;
    let roles: Array<string> = newMemberRoles;

    if (!roles.includes(role)) {
      roles = [...roles, role];
    } else {
      roles = roles.filter((item) => item !== role);
    }

    setNewMemberRoles(roles);
  };

  const isOnlyViewer = () =>
    currentMember?.roles.length === 1 && currentMember?.roles.includes("view");

  useEffect(() => {
    dispatch(fetchMembers(id as string) as any);
    dispatch(fetchInvites(id as string) as any);
    setStoreName(() => {
      const store = brandStoresList.find((item) => item.id === id);

      if (store) {
        return store.name;
      } else {
        return id;
      }
    });
  }, [id]);

  useEffect(() => {
    setFilteredMembers(members);
  }, [members]);

  useEffect(() => {
    setMemberButtonDisabled(!newMemberEmail || newMemberRoles.length === 0);
  }, [newMemberEmail, newMemberRoles]);

  useEffect(() => {
    setCurrentMember(members.find((member) => member.current_user));
  }, [members, membersLoading, invitesLoading]);

  return (
    <>
      <main className="l-main">
        <div className="p-panel">
          <div className="p-panel__content">
            <div className="u-fixed-width">
              {!membersNotFound && !invitesNotFound && (
                <SectionNav sectionName="members" />
              )}
            </div>
            {membersLoading && invitesLoading ? (
              <div className="u-fixed-width">
                <Spinner text="Loading&hellip;" />
              </div>
            ) : membersNotFound || invitesNotFound ? (
              <StoreNotFound />
            ) : isOnlyViewer() ? (
              <Navigate to={`/admin/${id}/snaps`} />
            ) : (
              <>
                <Row>
                  <Col size={6}>
                    <SearchBox
                      placeholder="Search and filter"
                      autocomplete="off"
                      onChange={(query) => {
                        if (query) {
                          setFilteredMembers(
                            members.filter(
                              (member) =>
                                member.displayname.includes(query) ||
                                member.email.includes(query)
                            )
                          );
                        } else {
                          setFilteredMembers(members);
                        }
                      }}
                    />
                  </Col>
                  <Col size={6} className="u-align--right">
                    <Button
                      onClick={() => {
                        setSidePanelOpen(true);
                      }}
                    >
                      Add new member
                    </Button>
                  </Col>
                </Row>
                <div className="u-fixed-width app-accordion">
                  <Accordion
                    expanded="members-table"
                    sections={[
                      {
                        key: "members-table",
                        title: `${filteredMembers.length} members`,
                        content: (
                          <MembersTable
                            filteredMembers={filteredMembers}
                            changedMembers={changedMembers}
                            setChangedMembers={setChangedMembers}
                          />
                        ),
                      },
                      {
                        key: "invites-table",
                        title: `${invites.length} invites`,
                        content: (
                          <InvitesTable
                            invites={invites}
                            setNotificationText={setNotificationText}
                            setShowSuccessNotification={
                              setShowSuccessNotification
                            }
                            setShowErrorNotification={setShowErrorNotification}
                          />
                        ),
                      },
                    ]}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <div
        className={`l-aside__overlay ${sidePanelOpen ? "" : "u-hide"}`}
        onClick={() => {
          setSidePanelOpen(false);
        }}
      ></div>
      <aside
        className={`l-aside ${sidePanelOpen ? "" : "is-collapsed"}`}
        id="aside-panel"
      >
        <div className="p-panel is-flex-column">
          <div className="p-panel__header">
            <h4 className="p-panel__title">
              {showInviteForm
                ? "Send invitation to join this store"
                : "Add new member"}
            </h4>
          </div>
          <div className="p-panel__content u-no-padding--top">
            {showInviteForm && (
              <div className="u-fixed-width">
                <p>
                  We couldn&rsquo;t find an existing user for the email{" "}
                  <strong>{newMemberEmail}</strong>
                </p>
                <p>
                  Would you like to send an email inviting them to join{" "}
                  <strong>{storeName}</strong>?
                </p>
                <p>
                  When they accept they will be granted the following
                  permissions:
                </p>
                <ul>
                  {newMemberRoles.map((role: string) => (
                    <li key={role}>
                      <div>{ROLES[role].name}</div>
                      <small className="u-text-muted">
                        {ROLES[role].description}
                      </small>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!showInviteForm && (
              <div className="u-fixed-width">
                <Input
                  id="new-member-email"
                  type="email"
                  label="Email"
                  placeholder="yourname@example.com"
                  help="The primary email for the Ubuntu One account"
                  value={newMemberEmail}
                  onChange={(e) => {
                    setNewMemberEmail(e.target.value);
                  }}
                />
                <h4>Roles</h4>
                {Object.keys(ROLES).map((role) => (
                  <Input
                    key={ROLES[role].name}
                    type="checkbox"
                    id={role}
                    label={ROLES[role].name}
                    help={ROLES[role].description}
                    onChange={handleRoleChange}
                    checked={newMemberRoles.includes(role)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="p-panel__footer u-align--right">
            <div className="u-fixed-width">
              <Button
                className="u-no-margin--bottom"
                onClick={() => {
                  setSidePanelOpen(false);
                  setNewMemberEmail("");
                  setNewMemberRoles([]);
                }}
              >
                Cancel
              </Button>

              {!showInviteForm && (
                <Button
                  appearance="positive"
                  className={`u-no-margin--bottom u-no-margin--right ${
                    isSaving ? "has-icon is-dark" : ""
                  }`}
                  disabled={memberButtonDisabled}
                  onClick={() => {
                    handleInvite("members");
                  }}
                >
                  {isSaving ? (
                    <>
                      <i className="p-icon--spinner u-animation--spin is-light"></i>
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Add member"
                  )}
                </Button>
              )}

              {showInviteForm && (
                <Button
                  appearance="positive"
                  className={`u-no-margin--bottom u-no-margin--right ${
                    isSaving ? "has-icon is-dark" : ""
                  }`}
                  onClick={() => {
                    handleInvite("invite");
                  }}
                >
                  {isSaving ? (
                    <>
                      <i className="p-icon--spinner u-animation--spin is-light"></i>
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Send invite"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {changedMembers.length ? (
        <aside className="l-status">
          <div className="u-fixed-width u-align--right">
            <Button
              className={`u-no-margin--bottom ${
                isSaving ? "has-icon is-dark" : ""
              }`}
              appearance="positive"
              onClick={() => {
                setIsSaving(true);

                const memberData = new FormData();
                const members = changedMembers.map((m: Member) => {
                  return {
                    email: m.email,
                    roles: m.roles,
                  };
                });

                memberData.set("csrf_token", window.CSRF_TOKEN);
                memberData.set("members", JSON.stringify(members));

                fetch(`/admin/store/${id}/members`, {
                  method: "POST",
                  body: memberData,
                })
                  .then((response) => {
                    if (response.status === 200) {
                      return response.json();
                    } else {
                      throw Error();
                    }
                  })
                  .then(() => {
                    // Add timeout so that the user has time to notice the save action
                    // in the event of it happening very fast
                    setTimeout(() => {
                      setChangedMembers([]);
                      setIsSaving(false);
                      setShowSuccessNotification(true);
                      setNotificationText("Member roles have been changed");

                      setTimeout(() => {
                        setShowSuccessNotification(false);
                      }, 5000);
                    }, 1500);
                  })
                  .catch(() => {
                    setIsSaving(false);
                    setShowErrorNotification(true);

                    setTimeout(() => {
                      setShowErrorNotification(false);
                    }, 5000);
                  });
              }}
            >
              {isSaving ? (
                <>
                  <i className="p-icon--spinner u-animation--spin is-light"></i>
                  <span>Saving...</span>
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </aside>
      ) : null}

      <div className="p-notification-center">
        {showSuccessNotification && (
          <Notification
            severity="positive"
            onDismiss={() => setShowSuccessNotification(false)}
          >
            {notificationText}
          </Notification>
        )}

        {showErrorNotification && (
          <Notification
            severity="negative"
            onDismiss={() => setShowErrorNotification(false)}
          >
            Something went wrong.{" "}
            <a href="https://github.com/canonical-web-and-design/snapcraft.io/issues/new">
              Report a bug
            </a>
          </Notification>
        )}
      </div>
    </>
  );
}

export default Members;
