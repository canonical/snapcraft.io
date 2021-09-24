import React from "react";
import PropTypes from "prop-types";
import { MainTable, CheckboxInput } from "@canonical/react-components";

function MembersTable({ filteredMembers }) {
  return (
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
                    member.current_user && member.roles.includes("admin")
                  }
                />
              ),
            },
            {
              "aria-label": "Reviewer",
              content: (
                <CheckboxInput checked={member.roles.includes("review")} />
              ),
            },
            {
              "aria-label": "Viewer",
              content: (
                <CheckboxInput checked={member.roles.includes("view")} />
              ),
            },
            {
              "aria-label": "Publisher",
              content: (
                <CheckboxInput checked={member.roles.includes("access")} />
              ),
            },
          ],
        };
      })}
    />
  );
}

MembersTable.propTypes = {
  filteredMembers: PropTypes.array.isRequired,
};

export default MembersTable;
