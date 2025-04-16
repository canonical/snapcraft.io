import { useQuery } from "react-query";

function useValidationSet(validationSetId: string | undefined) {
  return useQuery({
    queryKey: ["validationSet", validationSetId],
    queryFn: async () => {
      const response = await fetch(`/api/validation-sets/${validationSetId}`);

      if (!response.ok) {
        throw new Error("Unable to fetch validation set");
      }

      const validationSetData = await response.json();

      if (!validationSetData.success) {
        throw new Error(validationSetData.message);
      }

      return validationSetData.data;
    },
  });
}

export default useValidationSet;
