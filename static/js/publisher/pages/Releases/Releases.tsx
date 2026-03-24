import { useParams } from "react-router-dom";
import { useQuery } from "react-query";

import Release from "./Release";
import { setPageTitle } from "../../utils";
import Loader from "../../components/Loader";

import { ReleasesAPIResponse } from "../../types/releaseTypes";

function Releases(): React.JSX.Element {
  const { snapId } = useParams();
  const { isLoading, isFetched, data } = useQuery({
    queryKey: ["releases", snapId],
    queryFn: async (): Promise<ReleasesAPIResponse> => {
      const response = await fetch(`/api/${snapId}/releases`);

      if (!response.ok) {
        throw new Error("There was a problem fetching releases data");
      }

      const responseData = (await response.json()) as ReleasesAPIResponse;

      if (!responseData.success) {
        throw new Error("There was a problem fetching releases data");
      }

      return responseData;
    },
  });

  // TODO: fix missing currentTrack and wrong options

  setPageTitle(`Releases for ${snapId}`);

  return (
    <>
      {isLoading && <Loader text={`Loading ${snapId} builds data`} />}

      {isFetched && data && (
        <Release
          snapName={snapId || ""}
          apiData={data}
        />
      )}
    </>
  );
}

export default Releases;
