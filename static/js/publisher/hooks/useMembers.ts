import { useQuery } from "react-query";

function useMembers(storeId: string) {
  return useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const response = await fetch(`/api/store/${storeId}/members`);

      if (!response.ok) {
        throw new Error("Unable to fetch members");
      }

      const responseData = await response.json();

      return responseData;
    },
  });
}

export default useMembers;
