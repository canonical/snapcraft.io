import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { MainTable, CheckboxInput } from "@canonical/react-components";
import ROLES from "./memberRoles";

function MembersTable({ filteredMembers, changedMembers, setChangedMembers }) {
  const [members, setMembers] = useState(filteredMembers);

  const handleRoleChange = (member, role) => {
    const updatedMembers = members.map((item) => {
      let updatedItem = {};

      if (item.id === member.id) {
        if (item.roles.includes(role)) {
          updatedItem = {
            ...item,
            roles: item.roles.filter((r) => r !== role),
          };
        } else {
          updatedItem = {
            ...item,
            roles: [].concat(item.roles, [role]),
          };
        }

        if (changedMembers.find((m) => m.id === member.id)) {
          if (
            JSON.stringify([...member.roles].sort()) !==
            JSON.stringify([...updatedItem.roles].sort())
          ) {
            setChangedMembers(
              [].concat(changedMembers.filter((m) => m.id !== member.id)),
              [updatedItem]
            );
          } else {
            setChangedMembers(changedMembers.filter((m) => m.id !== member.id));
          }
        } else {
          if (
            JSON.stringify([...member.roles].sort()) !==
            JSON.stringify([...updatedItem.roles].sort())
          ) {
            setChangedMembers([].concat(changedMembers, [updatedItem]));
          }
        }

        return updatedItem;
      }

      return item;
    });

    setMembers(updatedMembers);
  };

  useEffect(() => {
    setMembers(filteredMembers);
  }, [filteredMembers]);

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
                title={ROLES.admin.description}
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
                title={ROLES.review.description}
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
              <i className="p-icon--information" title={ROLES.view.description}>
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
                title={ROLES.access.description}
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
                  defaultChecked={member.roles.includes("admin")}
                  disabled={
                    member.current_user && member.roles.includes("admin")
                  }
                  onChange={() => {
                    handleRoleChange(member, "admin");
                  }}
                />
              ),
            },
            {
              "aria-label": "Reviewer",
              content: (
                <CheckboxInput
                  defaultChecked={member.roles.includes("review")}
                  onChange={(e) => {
                    handleRoleChange(member, "review");
                  }}
                />
              ),
            },
            {
              "aria-label": "Viewer",
              content: (
                <CheckboxInput
                  defaultChecked={member.roles.includes("view")}
                  onChange={() => {
                    handleRoleChange(member, "view");
                  }}
                />
              ),
            },
            {
              "aria-label": "Publisher",
              content: (
                <CheckboxInput
                  defaultChecked={member.roles.includes("access")}
                  onChange={(e) => {
                    handleRoleChange(member, "access");
                  }}
                />
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
  changedMembers: PropTypes.array.isRequired,
  setChangedMembers: PropTypes.func.isRequired,
};

export default MembersTable;
