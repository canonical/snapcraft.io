import { useQuery } from "react-query";
import { ISnap } from "../types";

function useFetchAccountSnaps() {
  return useQuery({
    queryKey: ["accountSnaps"],
    queryFn: async () => {
      const response = await fetch("/snaps.json");
      const snapsData = await response.json();

      const snaps = Object.entries(snapsData.snaps).map(
        ([snapName, value]) => ({
          snapName,
          ...(value as Omit<ISnap, "snapName">),
        })
      );

      const registeredSnaps = Object.entries(snapsData["registered_snaps"]).map(
        ([snapName, value]) => ({
          snapName,
          ...(value as Omit<ISnap, "snapName">),
        })
      );

      return {
        snaps,
        registeredSnaps,
        currentUser: snapsData.current_user,
      };
    },
    retry: 0,
    refetchOnWindowFocus: false,
  });
}

export default useFetchAccountSnaps;
