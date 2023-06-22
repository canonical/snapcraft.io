import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { MainTable, CheckboxInput } from "@canonical/react-components";
import ROLES from "./memberRoles";

function MembersTable({ filteredMembers, changedMembers, setChangedMembers }) {
  const [members, setMembers] = useState(filteredMembers);

  const checkArrayEqual = (array1, array2) => {
    if (array1.length !== array2.length) {
      return false;
    }

    const array2Sorted = array2.slice().sort();

    return array1
      .slice()
      .sort()
      .every((val, idx) => val === array2Sorted[idx]);
  };

  const handleRoleChange = (currentMember, role) => {
    const updatedMembers = members.map((member) => {
      let updatedItem = {};

      if (member.id !== currentMember.id) {
        return member;
      }

      if (member.roles.includes(role)) {
        updatedItem = {
          ...member,
          roles: member.roles.filter((r) => r !== role),
        };
      } else {
        updatedItem = {
          ...member,
          roles: [].concat(member.roles, [role]),
        };
      }

      const changedMember = changedMembers.find(
        (m) => m.id === currentMember.id
      );

      const originalMember = filteredMembers.find(
        (m) => m.id === currentMember.id
      );

      if (changedMember) {
        if (checkArrayEqual(originalMember.roles, updatedItem.roles)) {
          setChangedMembers(
            changedMembers.filter((m) => m.id !== currentMember.id)
          );
        } else {
          setChangedMembers(
            [].concat(
              changedMembers.filter((m) => m.id !== currentMember.id),
              [updatedItem]
            )
          );
        }
      } else {
        setChangedMembers([].concat(changedMembers, [updatedItem]));
      }

      return updatedItem;
    });

    setMembers(updatedMembers);
  };

  useEffect(() => {
    setMembers(filteredMembers);
  }, [filteredMembers]);

  const mobileLabelStyles = {
    display: "inline-block",
    marginLeft: "0.5rem",
  };

  return (
    <MainTable
      responsive={true}
      headers={[
        { content: "Users" },
        { content: "Email" },
        {
          style: { width: "10%" },
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
          style: { width: "10%" },
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
          style: { width: "10%" },
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
          style: { width: "10%" },
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
                <>
                  <CheckboxInput
                    defaultChecked={member.roles.includes("admin")}
                    disabled={
                      member.current_user && member.roles.includes("admin")
                    }
                    onChange={() => {
                      handleRoleChange(member, "admin");
                    }}
                  />
                  <span className="u-hide--large" style={mobileLabelStyles}>
                    Admin
                  </span>
                </>
              ),
            },
            {
              "aria-label": "Reviewer",
              content: (
                <>
                  <CheckboxInput
                    defaultChecked={member.roles.includes("review")}
                    onChange={() => {
                      handleRoleChange(member, "review");
                    }}
                  />
                  <span className="u-hide--large" style={mobileLabelStyles}>
                    Reviewer
                  </span>
                </>
              ),
            },
            {
              "aria-label": "Viewer",
              content: (
                <>
                  <CheckboxInput
                    defaultChecked={member.roles.includes("view")}
                    onChange={() => {
                      handleRoleChange(member, "view");
                    }}
                  />
                  <span className="u-hide--large" style={mobileLabelStyles}>
                    Viewer
                  </span>
                </>
              ),
            },
            {
              "aria-label": "Publisher",
              content: (
                <>
                  <CheckboxInput
                    defaultChecked={member.roles.includes("access")}
                    onChange={() => {
                      handleRoleChange(member, "access");
                    }}
                  />
                  <span className="u-hide--large" style={mobileLabelStyles}>
                    Publisher
                  </span>
                </>
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
