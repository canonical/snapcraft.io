import debounce from "../libs/debounce";

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

function updateMembers(membersData) {
  membersData = membersData || [];
  const manageMembersForm = document.getElementById("manage-members-form");
  const saveButton = manageMembersForm.querySelector(".js-save-button");
  const roleCheckboxes = Array.prototype.slice.call(
    document.querySelectorAll(".js-role-checkbox")
  );

  const newData = membersData.map(function (data) {
    return Object.assign({}, data);
  });

  roleCheckboxes.forEach(function (checkbox) {
    checkbox.addEventListener("change", function (e) {
      const target = e.target;
      const role = e.target.name;
      const stateBox = target.nextElementSibling;

      const member = newData.find(function (data) {
        return data.email === target.dataset.memberEmail;
      });

      const originalMember = membersData.find(function (data) {
        return data.email === target.dataset.memberEmail;
      });

      if (checkbox.checked && !member.roles.includes(role)) {
        member.roles = member.roles.concat(role);
      }

      if (!checkbox.checked && member.roles.includes(role)) {
        member.roles = member.roles.filter(function (data) {
          return data !== role;
        });
      }

      if (checkbox.checked && !originalMember.roles.includes(role)) {
        stateBox.classList.add("add");
        stateBox.classList.remove("remove");
      }

      if (!checkbox.checked && originalMember.roles.includes(role)) {
        stateBox.classList.add("remove");
        stateBox.classList.remove("add");
      }

      if (
        (checkbox.checked && originalMember.roles.includes(role)) ||
        (!checkbox.checked && !originalMember.roles.includes(role))
      ) {
        stateBox.classList.remove("add", "remove");
      }

      if (
        JSON.stringify(member.roles.sort()) !==
        JSON.stringify(originalMember.roles.sort())
      ) {
        member.dirty = true;
      } else {
        member.dirty = false;
      }

      const dirtyState = newData.filter((data) => data.dirty);

      let changeCount = 0;

      dirtyState.forEach((member) => {
        const oldMember = membersData.find((data) => data.id === member.id);

        let numberOfChanges = 0;

        if (member.roles.length >= oldMember.roles.length) {
          numberOfChanges = member.roles.filter((x) => {
            return oldMember.roles.indexOf(x) === -1;
          }).length;
        } else {
          numberOfChanges = oldMember.roles.filter((x) => {
            return member.roles.indexOf(x) === -1;
          }).length;
        }

        changeCount += numberOfChanges;
      });

      if (dirtyState.length) {
        if (changeCount === 1) {
          saveButton.innerText = "Save 1 change";
        } else {
          saveButton.innerText = `Save ${changeCount} changes`;
        }
      } else {
        saveButton.innerText = "Save changes";
      }

      saveButton.disabled = !dirtyState.length;
    });
  });

  manageMembersForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const form = e.target;
    const membersField = manageMembersForm.querySelector("#members");
    const dirtyData = newData.filter(function (data) {
      return data.dirty;
    });

    membersField.value = JSON.stringify(
      dirtyData.map(function (data) {
        return {
          email: data.email,
          roles: data.roles,
        };
      })
    );

    form.submit();
  });
}

function filterMembers(members, roles) {
  members = members || [];
  roles = roles || [];

  const membersTableBody = document.querySelector("#members-table tbody");
  const filterMembersField = document.querySelector("#filter-members");

  filterMembersField.addEventListener(
    "keyup",
    debounce((e) => {
      const query = e.target.value.toLowerCase();
      let filteredMembers = members.filter((member) => {
        return (
          member.displayname.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.username.toLowerCase().includes(query)
        );
      });

      if (!query) {
        filteredMembers = members;
      }

      membersTableBody.innerHTML = "";

      filteredMembers.forEach((member) => {
        membersTableBody.appendChild(buildMemberRow(member, roles));
      });

      updateMembers(filteredMembers);
    }),
    100
  );
}

function buildMemberRow(member, roles) {
  const tr = document.createElement("tr");

  let rowContent = `
    <td><i class="p-icon--user u-hide--small"></i> ${member.displayname}</td>
  `;

  roles.forEach((role) => {
    rowContent += `<td aria-label="${role.role}">`;
    rowContent += "<label class='p-checkbox u-no-padding--top'>";
    rowContent += `
      <input
        type="checkbox"
        aria-labelledby="role-${role.role}"
        class="p-checkbox__input js-role-checkbox"
        name="${role.role}"
        data-member-email="${member.email}"
        ${member.roles.includes(role.role) ? "checked" : ""}
      >
      <span class="p-checkbox__label u-hide">${role.label}</span>
    `;
    rowContent += "</label>";
    rowContent += "</td>";
  });

  tr.innerHTML = rowContent;

  return tr;
}

function initManageMembersTable(members, roles) {
  updateMembers(members);
  filterMembers(members, roles);
}

export { inviteMember, initManageMembersTable };
