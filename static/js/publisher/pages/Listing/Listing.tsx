import { useParams, Link } from "react-router-dom";
import { useQuery } from "react-query";
import { Strip, Notification } from "@canonical/react-components";

import ListingForm from "./ListingForm";

import { setPageTitle } from "../../utils";
import Loader from "../../components/Loader";

function Listing(): React.JSX.Element {
  const { snapId } = useParams();
  const { data, isLoading, refetch, status } = useQuery({
    queryKey: ["listing", snapId],
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
      {isLoading && <Loader text={`Loading ${snapId} listing data`} />}

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
