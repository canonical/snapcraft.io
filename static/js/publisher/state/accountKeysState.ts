import { atom } from "jotai";
import type { AccountKeyData } from "../types/accountKeysTypes";

const accountKeysState = atom([] as AccountKeyData[]);

export { accountKeysState };
