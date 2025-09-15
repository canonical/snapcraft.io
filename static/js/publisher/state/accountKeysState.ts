import type { AccountKeysData } from "../types/shared";
import { atom } from "jotai";

const accountKeysState = atom(null as unknown as AccountKeysData);

export { accountKeysState };
