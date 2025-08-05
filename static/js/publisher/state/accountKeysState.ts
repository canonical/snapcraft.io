import type { AccountKeysData } from "../types/accountKeysTypes";
import { atom } from "jotai";

const accountKeysState = atom(null as unknown as AccountKeysData);

export { accountKeysState };
