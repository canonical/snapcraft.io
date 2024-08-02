import { useQuery } from "react-query";

function useVerified(snapName: string | undefined) {
  return useQuery("verified", async () => {
    const response = await fetch(`/api/${snapName}/verify`);

    if (!response.ok) {
      throw new Error("There was a problem verifying this domain");
    }

    const responseData = await response.json();

    return responseData;
  });
}

export default useVerified;
