function initManageMemberRoles() {
  const manageMemberRolesForm = document.getElementById(
    "manage-member-roles-form"
  );

  if (manageMemberRolesForm) {
    manageMemberRolesForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const form = event.target;
      const membersField = form.querySelector(
        "[data-js-member-roles-hidden-field]"
      );
      const manageRolesEmailField = form.querySelector(
        "[data-js-manage-roles-email-field]"
      );
      const roleFields = Array.prototype.slice.call(
        manageMemberRolesForm.querySelectorAll("[data-js-role-field]:checked")
      );
      const accountIdField = form.querySelector("[data-js-account-id-field]");

      const roles = roleFields.map((role) => {
        return role.name;
      });

      const member = { email: manageRolesEmailField.value, roles };

      if (accountIdField) {
        member.id = accountIdField.value;
      }

      membersField.value = JSON.stringify([member]);

      form.submit();
    });
  }

  const sidePanel = document.querySelector("[data-js-side-panel]");
  const openSidePanelButton = document.querySelector(
    "[data-js-open-side-panel-btn]"
  );
  const closeSidePanelButton = document.querySelector(
    "[data-js-close-side-panel-btn]"
  );

  openSidePanelButton.addEventListener("click", () => {
    sidePanel.classList.add("p-side-panel--open");
  });

  closeSidePanelButton.addEventListener("click", () => {
    sidePanel.classList.remove("p-side-panel--open");
    window.location.search = "";
  });
}

export { initManageMemberRoles };
