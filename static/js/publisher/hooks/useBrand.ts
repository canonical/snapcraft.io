import { useQuery } from "react-query";

function useBrand(id: string | undefined) {
  return useQuery({
    queryKey: ["brand", id],
    queryFn: async () => {
      const response = await fetch(`/api/store/${id}/brand`);

      if (!response.ok) {
        throw new Error("There was a problem fetching models");
      }

      const brandData = await response.json();

      if (!brandData.success) {
        throw new Error(brandData.message);
      }

      return brandData.data;
    },
  });
}

export default useBrand;
