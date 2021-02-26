function inviteMember() {
  const inviteMemberForm = document.querySelector("#invite-member-form");
  const emailField = inviteMemberForm.querySelector("#invite-member-email");
  const saveInviteMember = inviteMemberForm.querySelector(
    "#invite-member-button"
  );
  const roleFields = Array.prototype.slice.call(
    inviteMemberForm.querySelectorAll(".p-checkbox__input")
  );

  emailField.addEventListener("change", function () {
    const checkedFields = roleFields.filter(function (field) {
      return field.checked;
    });

    if (emailField.value && checkedFields.length) {
      saveInviteMember.disabled = false;
    } else {
      saveInviteMember.disabled = true;
    }
  });

  roleFields.forEach(function (field) {
    field.addEventListener("change", function () {
      const checkedFields = roleFields.filter(function (field) {
        return field.checked;
      });

      if (emailField.value && checkedFields.length) {
        saveInviteMember.disabled = false;
      } else {
        saveInviteMember.disabled = true;
      }
    });
  });

  inviteMemberForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const form = e.target;
    const inviteMembersField = form.querySelector("#invite-members");
    const emailField = form.querySelector("#invite-member-email");
    const roleFields = Array.prototype.slice.call(
      form.querySelectorAll(".p-checkbox__input")
    );

    const members = [];
    const newMember = {
      email: emailField.value,
      roles: [],
    };

    roleFields.forEach(function (role) {
      if (role.checked) {
        newMember.roles.push(role.name);
      }
    });

    members.push(newMember);

    inviteMembersField.value = JSON.stringify(members);

    form.submit();
  });
}

function init() {
  inviteMember();
}

export { init };
