import { atom } from "jotai";

import type { UserPrivileges } from "../types/shared";

const userPrivilegesState = atom(null as UserPrivileges);

export { userPrivilegesState };
