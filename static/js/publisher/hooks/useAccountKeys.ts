import { useQuery } from "react-query";

function useAccountKeys() {
  return useQuery("account_keys", async () => {
    const response = await fetch("/account-keys.json");

    if (!response.ok) {
      return {
        data: null,
      };
    }

    const keys = await response.json();

    return keys;
  });
}

export default useAccountKeys;
