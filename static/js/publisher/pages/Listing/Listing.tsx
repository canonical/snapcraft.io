import { useParams, Link } from "react-router-dom";
import { useQuery } from "react-query";
import { Strip, Notification } from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import ListingForm from "./ListingForm";

import { setPageTitle } from "../../utils";

function Listing(): JSX.Element {
  const { snapId } = useParams();
  const { data, isLoading, refetch, status } = useQuery({
    queryKey: ["listing"],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/listing`);

      if (!response.ok) {
        throw new Error("There was a problem fetching listing data");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    },
  });

  setPageTitle(`Listing data for ${snapId}`);

  return (
    <>
      <h1 className="p-heading--4" aria-live="polite">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /
        Listing
      </h1>

      <SectionNav snapName={snapId} activeTab="listing" />

      {isLoading && (
        <Strip shallow>
          <p>
            <i className="p-icon--spinner u-animation--spin"></i>&nbsp;Loading{" "}
            {snapId} listing data
          </p>
        </Strip>
      )}

      {!isLoading && status === "error" && (
        <Strip shallow>
          <Notification severity="information">
            Editing listing data is not available for this snap. Make sure{" "}
            <Link to="/snaps">this snap is published</Link>.
          </Notification>
        </Strip>
      )}

      {data && <ListingForm data={data} refetch={refetch} />}
    </>
  );
}

export default Listing;
