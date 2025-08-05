import { atom } from "recoil";
import type { AccountKeysData } from "../types/shared";

const accountKeysState = atom({
  key: "accountKeys",
  default: null as unknown as AccountKeysData,
});

export { accountKeysState };
