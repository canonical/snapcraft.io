import { CheckboxInput } from "@canonical/react-components";

import ROLES from "./memberRoles";

import type { Member } from "../../types/shared";

type Props = {
  member: Member;
  handleRoleChange: (member: Member, role: string) => void;
  memberRole: "admin" | "review" | "view" | "access";
};

function MemberRoleCheckbox({ member, handleRoleChange, memberRole }: Props) {
  return (
    <CheckboxInput
      checked={member.roles.includes(memberRole)}
      onChange={() => {
        handleRoleChange(member, memberRole);
      }}
      label={<span className="u-hide--large">{ROLES[memberRole].name}</span>}
    />
  );
}

export default MemberRoleCheckbox;
