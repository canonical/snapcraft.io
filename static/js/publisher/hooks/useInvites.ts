import { useQuery } from "react-query";

function useInvites(storeId: string) {
  return useQuery({
    queryKey: ["invites"],
    queryFn: async () => {
      const response = await fetch(`/api/store/${storeId}/invites`);

      if (!response.ok) {
        throw new Error("Unable to fetch invites");
      }

      const responseData = await response.json();

      return responseData;
    },
  });
}

export default useInvites;
