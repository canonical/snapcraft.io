import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Spinner,
  Accordion,
  MainTable,
  CheckboxInput,
} from "@canonical/react-components";

import { membersSelector } from "../selectors";
import { fetchMembers } from "../slices/membersSlice";

import SectionNav from "../SectionNav";

function Members() {
  const members = useSelector(membersSelector);
  const membersLoading = useSelector((state) => state.members.loading);
  const dispatch = useDispatch();
  const { id } = useParams();

  useEffect(() => {
    dispatch(fetchMembers(id));
  }, [id]);

  return (
    <main className="l-main">
      <div className="p-panel">
        <div className="p-panel__content">
          <div className="u-fixed-width">
            <SectionNav sectionName="members" />
          </div>
          {membersLoading ? (
            <div className="u-fixed-width">
              <Spinner text="Loading&hellip;" />
            </div>
          ) : (
            <div className="u-fixed-width">
              <Accordion
                expanded="members-table"
                sections={[
                  {
                    key: "members-table",
                    title: `${members.length} members`,
                    content: (
                      <MainTable
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
                        rows={members.map((member) => {
                          return {
                            columns: [
                              {
                                className: "u-truncate",
                                content: member.displayname,
                              },
                              {
                                className: "u-truncate",
                                content: member.email,
                              },
                              {
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
                                content: (
                                  <CheckboxInput
                                    checked={member.roles.includes("review")}
                                  />
                                ),
                              },
                              {
                                content: (
                                  <CheckboxInput
                                    checked={member.roles.includes("view")}
                                  />
                                ),
                              },
                              {
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
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default Members;
