import { useQuery } from "react-query";

function usePublisher() {
  return useQuery("publisher", async () => {
    const response = await fetch("/account.json");

    if (!response.ok) {
      return {
        publisher: null,
      };
    }

    const publisherData = await response.json();

    return publisherData;
  });
}

export default usePublisher;
