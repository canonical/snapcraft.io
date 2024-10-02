import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { Strip } from "@canonical/react-components";

import PageHeader from "../../../shared/PageHeader";
import ListingForm from "../ListingForm";

function App(): JSX.Element {
  const { snapName } = useParams();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["listing"],
    queryFn: async () => {
      const response = await fetch(`/api/${snapName}/listing`);

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
      <PageHeader
        snapName={snapName}
        snapTitle={snapName}
        activeTab="listing"
      />

      {isLoading && (
        <Strip shallow>
          <p>
            <i className="p-icon--spinner u-animation--spin"></i>&nbsp;Loading{" "}
            {snapName} listing data
          </p>
        </Strip>
      )}

      {data && <ListingForm data={data} refetch={refetch} />}
    </>
  );
}

export default App;
