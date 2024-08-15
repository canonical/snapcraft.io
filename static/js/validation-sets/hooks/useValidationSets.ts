import { useQuery } from "react-query";

function useValidationSets() {
  return useQuery({
    queryKey: ["validationSets"],
    queryFn: async () => {
      const response = await fetch("/api/validation-sets");

      if (!response.ok) {
        throw new Error("Unable to fetch validation sets");
      }

      const validationSetsData = await response.json();

      if (!validationSetsData.success) {
        throw new Error(validationSetsData.message);
      }

      return validationSetsData.data;
    },
  });
}

export default useValidationSets;
