import { useState, useEffect } from "react";
import { MainTable } from "@canonical/react-components";
import ROLES from "./memberRoles";

import MemberRoleCheckbox from "./MemberRoleCheckbox";

import type { Member } from "../../types/shared";

type Props = {
  filteredMembers: Array<Member>;
  changedMembers: Array<Member>;
  setChangedMembers: (members: Array<Member>) => void;
};

function MembersTable({
  filteredMembers,
  changedMembers,
  setChangedMembers,
}: Props): React.JSX.Element {
  const [members, setMembers] = useState<Member[]>(filteredMembers);

  const checkArrayEqual = (array1: Array<string>, array2: Array<string>) => {
    if (array1.length !== array2.length) {
      return false;
    }

    const array2Sorted = array2.slice().sort();

    return array1
      .slice()
      .sort()
      .every((val, idx) => val === array2Sorted[idx]);
  };

  const handleRoleChange = (currentMember: Member, role: string) => {
    const updatedMembers = members.map((member: Member) => {
      let updatedItem = { ...member };

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
          roles: [...member.roles, role],
        };
      }

      const changedMember = changedMembers.find(
        (m: Member) => m.id === currentMember.id,
      );

      const originalMember = filteredMembers.find(
        (m: Member) => m.id === currentMember.id,
      );

      if (changedMember && originalMember) {
        if (checkArrayEqual(originalMember.roles, updatedItem.roles)) {
          setChangedMembers(
            changedMembers.filter((m) => m.id !== currentMember.id),
          );
        } else {
          setChangedMembers([
            ...changedMembers.filter((m) => m.id !== currentMember.id),
            updatedItem,
          ]);
        }
      } else {
        setChangedMembers([...changedMembers, updatedItem]);
      }

      return updatedItem;
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
      rows={members.map((member: Member) => {
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
              content: (
                <MemberRoleCheckbox
                  member={member}
                  handleRoleChange={handleRoleChange}
                  memberRole="admin"
                />
              ),
            },
            {
              content: (
                <MemberRoleCheckbox
                  member={member}
                  handleRoleChange={handleRoleChange}
                  memberRole="review"
                />
              ),
            },
            {
              content: (
                <MemberRoleCheckbox
                  member={member}
                  handleRoleChange={handleRoleChange}
                  memberRole="view"
                />
              ),
            },
            {
              content: (
                <MemberRoleCheckbox
                  member={member}
                  handleRoleChange={handleRoleChange}
                  memberRole="access"
                />
              ),
            },
          ],
        };
      })}
    />
  );
}

export default MembersTable;
