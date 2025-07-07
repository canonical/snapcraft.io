import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { Strip, Icon } from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import PublisherSettingsForm from "./PublisherSettingsForm";

import { setPageTitle } from "../../utils";

function PublisherSettings() {
  const { snapId } = useParams();
  const { data, isLoading, isFetched } = useQuery({
    queryKey: ["settingsData"],
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
      <h1 className="p-heading--4" aria-live="polite">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /
        Settings
      </h1>

      <SectionNav snapName={snapId} activeTab="settings" />
      {isLoading && (
        <Strip shallow>
          <p>
            <Icon name="spinner" className="u-animate--spin" />
            &nbsp;Loading...
          </p>
        </Strip>
      )}
      {!isLoading && isFetched && data && (
        <PublisherSettingsForm settings={data} />
      )}
    </>
  );
}

export default PublisherSettings;
