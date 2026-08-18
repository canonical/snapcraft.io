import { useQuery } from "react-query";

import type { ApiResponse, UserPrivileges } from "../types/shared";

function useUserPrivileges() {
  return useQuery({
    queryKey: ["userPrivileges"],
    queryFn: async () => {
      const response = await fetch("/api/whoami");

      if (!response.ok) {
        throw new Error("Unable to fetch user information");
      }

      const responseData: ApiResponse<UserPrivileges> = await response.json();

      if (!responseData.success || !responseData.data) {
        throw new Error(responseData.message);
      }

      return responseData.data;
    },
  });
}

export default useUserPrivileges;
