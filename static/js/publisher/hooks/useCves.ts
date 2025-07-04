import { useQuery } from "react-query";

function useCves() {
  return useQuery({
    queryKey: ["cves"],
    queryFn: async () => {
      const response = await fetch(`/api/docker/3213/cves`);

      if (!response.ok) {
        throw new Error("Unable to fetch CVEs");
      }

      const responseData = await response.json();

      return responseData;
    },
  });
}

export default useCves;
