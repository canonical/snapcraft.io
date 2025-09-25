import { useQuery } from "react-query";
import { AccountKeysData } from "../types/accountKeysTypes";

function useAccountKeys() {
  return useQuery("account_keys", async () => {
    const response = await fetch("/account-keys.json");

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const keys = await response.json();
    return keys as AccountKeysData;
  });
}

export default useAccountKeys;