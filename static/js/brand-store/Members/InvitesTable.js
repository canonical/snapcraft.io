import React from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { MainTable } from "@canonical/react-components";

function InvitesTable({ invites }) {
  const ROLES = {
    admin: "admin",
    review: "reviewer",
    view: "viewer",
    access: "publisher",
  };

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

  return (
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
  );
}

InvitesTable.propTypes = {
  invites: PropTypes.array.isRequired,
};

export default InvitesTable;
