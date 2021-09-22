import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";
import {
  Spinner,
  Accordion,
  MainTable,
  CheckboxInput,
  Row,
  Col,
  Button,
  SearchBox,
} from "@canonical/react-components";

import { membersSelector, invitesSelector } from "../selectors";
import { fetchMembers } from "../slices/membersSlice";
import { fetchInvites } from "../slices/invitesSlice";

import SectionNav from "../SectionNav";

function Members() {
  const ROLES = {
    admin: "admin",
    review: "reviewer",
    view: "viewer",
    access: "publisher",
  };

  const members = useSelector(membersSelector);
  const membersLoading = useSelector((state) => state.members.loading);
  const invites = useSelector(invitesSelector);
  const invitesLoading = useSelector((state) => state.members.loading);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [filteredMembers, setFilteredMembers] = useState([]);

  const getInviteStatusText = (status) => {
    let iconClassName = "";

    if (status === "Pending") {
      iconClassName = "p-icon--status-waiting";
    }

    if (status === "Expired") {
      iconClassName = "p-icon--warning";
    }

    if (status === "Revoked") {
      iconClassName = "p-icon--error";
    }

    return (
      <>
        <i className={iconClassName} /> {status}
      </>
    );
  };

  const getRolesText = (roles) => {
    let rolesText = "";

    roles.forEach((role, index) => {
      rolesText += `${ROLES[role]} `;

      if (index < roles.length - 1) {
        rolesText += "| ";
      }
    });

    return rolesText;
  };

  useEffect(() => {
    dispatch(fetchMembers(id));
    dispatch(fetchInvites(id));
  }, [id]);

  useEffect(() => {
    setFilteredMembers(members);
  }, [members]);

  return (
    <main className="l-main">
      <div className="p-panel">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <SectionNav sectionName="members" />
          </div>
          {membersLoading && invitesLoading ? (
            <div className="u-fixed-width">
              <Spinner text="Loading&hellip;" />
            </div>
          ) : (
            <>
              <Row>
                <Col size="6">
                  <Button disabled>Add new member</Button>
                </Col>
                <Col size="6">
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
              </Row>
              <div className="u-fixed-width members-accordion">
                <Accordion
                  expanded="members-table"
                  sections={[
                    {
                      key: "members-table",
                      title: `${filteredMembers.length} members`,
                      content: (
                        <MainTable
                          responsive={true}
                          headers={[
                            { content: "Users" },
                            { content: "Email" },
                            {
                              content: (
                                <>
                                  <i
                                    className="p-icon--information"
                                    title="Admins manage the store's users and roles, and control the store's settings."
                                  >
                                    Role description
                                  </i>{" "}
                                  Admin
                                </>
                              ),
                            },
                            {
                              content: (
                                <>
                                  <i
                                    className="p-icon--information"
                                    title="Reviewers can approve or reject snaps, and edit snap declarations."
                                  >
                                    Role description
                                  </i>{" "}
                                  Reviewer
                                </>
                              ),
                            },
                            {
                              content: (
                                <>
                                  <i
                                    className="p-icon--information"
                                    title="Viewers are read-only users and can view snap details, metrics, and the contents of this store."
                                  >
                                    Role description
                                  </i>{" "}
                                  Viewer
                                </>
                              ),
                            },
                            {
                              content: (
                                <>
                                  <i
                                    className="p-icon--information"
                                    title="Publishers can invite collaborators to a snap, publish snaps and update snap details."
                                  >
                                    Role description
                                  </i>{" "}
                                  Publisher
                                </>
                              ),
                            },
                          ]}
                          rows={filteredMembers.map((member) => {
                            return {
                              columns: [
                                {
                                  className: "u-truncate",
                                  content: member.displayname,
                                  "aria-label": "Name",
                                },
                                {
                                  className: "u-truncate",
                                  content: member.email,
                                  "aria-label": "Email",
                                },
                                {
                                  "aria-label": "Admin",
                                  content: (
                                    <CheckboxInput
                                      checked={member.roles.includes("admin")}
                                      disabled={
                                        member.current_user &&
                                        member.roles.includes("admin")
                                      }
                                    />
                                  ),
                                },
                                {
                                  "aria-label": "Reviewer",
                                  content: (
                                    <CheckboxInput
                                      checked={member.roles.includes("review")}
                                    />
                                  ),
                                },
                                {
                                  "aria-label": "Viewer",
                                  content: (
                                    <CheckboxInput
                                      checked={member.roles.includes("view")}
                                    />
                                  ),
                                },
                                {
                                  "aria-label": "Publisher",
                                  content: (
                                    <CheckboxInput
                                      checked={member.roles.includes("access")}
                                    />
                                  ),
                                },
                              ],
                            };
                          })}
                        />
                      ),
                    },
                    {
                      key: "invites-table",
                      title: `${invites.length} invites`,
                      content: (
                        <MainTable
                          responsive={true}
                          headers={[
                            { content: "Status" },
                            { content: "Email" },
                            { content: "Expires" },
                            { content: "Roles" },
                          ]}
                          rows={invites.map((invite) => {
                            return {
                              columns: [
                                {
                                  "aria-label": "Status",
                                  content: getInviteStatusText(invite.status),
                                },
                                {
                                  "aria-label": "Email",
                                  content: invite.email,
                                  className: "u-truncate",
                                },
                                {
                                  "aria-label": "Expires",
                                  content: format(
                                    new Date(invite["expiration-date"]),
                                    "dd/MM/yyyy"
                                  ),
                                },
                                {
                                  "aria-label": "Roles",
                                  content: getRolesText(invite.roles),
                                },
                              ],
                            };
                          })}
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
  );
}

export default Members;
