import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { Strip } from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import ListingForm from "./ListingForm";

function Listing(): JSX.Element {
  const { snapId } = useParams();
  const { data, isLoading, refetch } = useQuery({
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

  return (
    <>
      <h1 className="p-heading--4">
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

      {data && <ListingForm data={data} refetch={refetch} />}
    </>
  );
}

export default Listing;
