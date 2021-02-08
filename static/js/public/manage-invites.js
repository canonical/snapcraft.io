import { format } from "date-fns";
import debounce from "../libs/debounce";

const ACTION_MESSAGES = {
  open:
    "Reopening your invite will send a new invite to this email. Do you still want to do it?",
  resend:
    "Resending your invite will send a reminder email to this user. Do you still want to do it?",
  revoke:
    "Revoking your invite will prevent this user from accepting your invite. Do you still want to do it?",
};

function updateInvites() {
  const inviteActionForms = document.querySelectorAll("[data-js-action-form]");
  const inviteModal = document.querySelector("#invite-modal");
  const inviteModalHeading = inviteModal.querySelector("#invite-modal-title");
  const inviteModalSubmitButton = inviteModal.querySelector(
    "[data-js-submit-invite-action]"
  );

  inviteActionForms.forEach((actionForm) => {
    actionForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const submitButton = actionForm.querySelector("[type='submit']");
      const inviteEmail = submitButton.dataset.inviteEmail;
      const inviteAction = submitButton.dataset.inviteAction;
      const inviteActionLabel = submitButton.dataset.inviteActionLabel;
      const invitesField = actionForm.querySelector("[name='invites']");
      const actionConfirmationMessage = document.querySelector(
        "[data-js-action-confirmation-message]"
      );

      invitesField.value = JSON.stringify([
        {
          email: inviteEmail,
          action: inviteAction,
        },
      ]);

      inviteModalHeading.innerText = `${inviteActionLabel} invite`;
      inviteModalSubmitButton.innerText = `${inviteActionLabel} invite`;
      inviteModalSubmitButton.dataset.currentForm = actionForm;
      actionConfirmationMessage.innerText = ACTION_MESSAGES[inviteAction];

      const handleModalSubmit = () => {
        inviteModalSubmitButton.disabled = true;
        actionForm.submit();
        e.target.removeEventListener("click", handleModalSubmit);
      };

      inviteModalSubmitButton.addEventListener("click", handleModalSubmit);
    });
  });
}

function filterInvites(
  pendingInvites,
  expiredInvites,
  revokedInvites,
  storeId,
  token
) {
  pendingInvites = pendingInvites || [];
  expiredInvites = expiredInvites || [];
  revokedInvites = revokedInvites || [];

  const invitesTableBody = document.querySelector("#invites-table tbody");
  const filterInvitesField = document.querySelector("#filter-invites");

  filterInvitesField.addEventListener(
    "keyup",
    debounce((e) => {
      const query = e.target.value.toLowerCase();

      let filteredPendingInvites = pendingInvites.filter((invite) => {
        return invite.email.toLowerCase().includes(query);
      });

      let filteredExpiredInvites = expiredInvites.filter((invite) => {
        return invite.email.toLowerCase().includes(query);
      });

      let filteredRevokedInvites = revokedInvites.filter((invite) => {
        return invite.email.toLowerCase().includes(query);
      });

      if (!query) {
        filteredPendingInvites = pendingInvites;
        filteredExpiredInvites = expiredInvites;
        filteredRevokedInvites = revokedInvites;
      }

      invitesTableBody.innerHTML = "";

      if (filteredPendingInvites.length > 0) {
        invitesTableBody.innerHTML += buildTableRows(
          filteredPendingInvites,
          "Pending",
          storeId,
          token
        );
      }

      if (filteredExpiredInvites.length > 0) {
        invitesTableBody.innerHTML += buildTableRows(
          filteredExpiredInvites,
          "Expired",
          storeId,
          token
        );
      }

      if (filteredRevokedInvites.length > 0) {
        invitesTableBody.innerHTML += buildTableRows(
          filteredRevokedInvites,
          "Revoked",
          storeId,
          token
        );
      }

      updateInvites();
    }),
    100
  );
}

function getInviteForm(storeId, token, action) {
  return `
    <form action="/admin/${storeId}/members/invite/update" method="post" class="p-action-form" data-js-action-form>
      <input type="hidden" name="invites" value="">
      <input type="hidden" name="csrf_token" value="${token}">
      <button type="submit" class="is-dense u-no-margin--bottom" data-invite-email="${action.email}" data-invite-action="${action.type}" data-invite-action-label="${action.label}" aria-controls="invite-modal">${action.label}</button>
    </form>
  `;
}

function buildTableRows(invites, status, storeId, token) {
  const ROLES = {
    admin: "admin",
    review: "reviewer",
    view: "viewer",
    access: "publisher",
  };

  const formatRoles = (roles) => {
    let rolesOutput = "";

    roles.forEach((role, index) => {
      if (index > 0) {
        rolesOutput += ", ";
      }

      rolesOutput += ROLES[role];
    });

    return rolesOutput;
  };

  let tableRows = "";

  tableRows = `
    <tr>
      <td aria-label="Status" rowspan="${invites.length}">${status}</td>
      <td aria-label="User">${invites[0].email}</td>
      <td aria-label="Expires">
        ${format(new Date(invites[0]["expiration-date"]), "dd MMMM yyyy")}
      </td>
      <td aria-label="Roles">${formatRoles(invites[0].roles)}</td>
      <td aria-label="Actions" class="u-align--right">
        ${
          status === "Pending"
            ? getInviteForm(storeId, token, {
                email: invites[0].email,
                type: "resend",
                label: "Resend",
              })
            : ""
        }
        ${
          status === "Pending"
            ? getInviteForm(storeId, token, {
                email: invites[0].email,
                type: "revoke",
                label: "Revoke",
              })
            : ""
        }
        ${
          status === "Expired"
            ? getInviteForm(storeId, token, {
                email: invites[0].email,
                type: "open",
                label: "Reopen",
              })
            : ""
        }
        ${
          status === "Revoked"
            ? getInviteForm(storeId, token, {
                email: invites[0].email,
                type: "open",
                label: "Reopen",
              })
            : ""
        }
      </td>
    </tr>
  `;

  invites.forEach((invite, index) => {
    if (index > 0) {
      tableRows += `
        <tr>
          <td aria-label="User">${invite.email}</td>
          <td aria-label="Expires">
            ${format(new Date(invite["expiration-date"]), "dd MMMM yyyy")}
          </td>
          <td aria-label="Roles">${formatRoles(invite.roles)}</td>
          <td aria-label="Actions" class="u-align--right">
            ${
              status === "Pending"
                ? getInviteForm(storeId, token, {
                    email: invite.email,
                    type: "resend",
                    label: "Resend",
                  })
                : ""
            }
            ${
              status === "Pending"
                ? getInviteForm(storeId, token, {
                    email: invite.email,
                    type: "revoke",
                    label: "Revoke",
                  })
                : ""
            }
            ${
              status === "Expired"
                ? getInviteForm(storeId, token, {
                    email: invite.email,
                    type: "open",
                    label: "Reopen",
                  })
                : ""
            }
            ${
              status === "Revoked"
                ? getInviteForm(storeId, token, {
                    email: invite.email,
                    type: "open",
                    label: "Reopen",
                  })
                : ""
            }
          </td>
        </tr>
      `;
    }
  });

  return tableRows;
}

function initUpdateInvitesTable(
  pendingInvites,
  expiredInvites,
  revokedInvites,
  storeId,
  token
) {
  updateInvites();
  filterInvites(pendingInvites, expiredInvites, revokedInvites, storeId, token);
}

export { initUpdateInvitesTable };
