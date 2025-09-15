import type { AccountKeysData } from "../types/accountKeysTypes";
import { atom } from "jotai";

interface AccountKeysState {
  data?: AccountKeysData;
  isLoading: boolean;
  isError?: boolean;
}

const accountKeysState = atom({ isLoading: true } as AccountKeysState);

export { accountKeysState };
