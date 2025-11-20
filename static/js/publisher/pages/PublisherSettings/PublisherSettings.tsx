import { useParams } from "react-router-dom";
import { useQuery } from "react-query";

import PublisherSettingsForm from "./PublisherSettingsForm";
import { setPageTitle } from "../../utils";
import Loader from "../../components/Loader";

function PublisherSettings() {
  const { snapId } = useParams();
  const { data, isLoading, isFetched } = useQuery({
    queryKey: ["settingsData", snapId],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/settings`);

      if (!response.ok) {
        throw new Error("There was a problem fetching settings data");
      }

      const data = await response.json();

      return data.data;
    },
  });

  setPageTitle(`Settings for ${snapId}`);

  return (
    <>
      {isLoading && <Loader />}
      {!isLoading && isFetched && data && (
        <PublisherSettingsForm settings={data} />
      )}
    </>
  );
}

export default PublisherSettings;
