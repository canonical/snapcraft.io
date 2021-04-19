function inviteMember() {
  const inviteMemberForm = document.querySelector("#invite-member-form");

  if (inviteMemberForm) {
    inviteMemberForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const form = event.target;
      const inviteMembersField = form.querySelector("#invite-members");
      const emailField = form.querySelector("#invite-member-email");
      const roleFields = Array.prototype.slice.call(
        form.querySelectorAll("[data-js-role-field]")
      );

      const roles = roleFields.map((role) => {
        return role.name;
      });

      inviteMembersField.value = JSON.stringify([
        { email: emailField.value, roles },
      ]);

      form.submit();
    });
  }
}

function init() {
  inviteMember();
}

export { init };
