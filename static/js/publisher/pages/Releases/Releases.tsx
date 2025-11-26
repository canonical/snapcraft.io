import { useParams } from "react-router-dom";
import { useQuery } from "react-query";

import Release from "./Release";
import { setPageTitle } from "../../utils";
import Loader from "../../components/Loader";

function Releases(): React.JSX.Element {
  const { snapId } = useParams();
  const { isLoading, isFetched, data } = useQuery({
    queryKey: ["releases", snapId],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/releases`);

      if (!response.ok) {
        throw new Error("There was a problem fetching releases data");
      }

      const responseData = await response.json();

      if (!responseData.success) {
        throw new Error("There was a problem fetching releases data");
      }

      return responseData.data;
    },
  });

  setPageTitle(`Releases for ${snapId}`);

  return (
    <>
      {isLoading && <Loader text={`Loading ${snapId} builds data`} />}

      {isFetched && data && (
        <Release
          snapName={snapId || ""}
          releasesData={data.release_history}
          channelMap={data.channel_map}
          tracks={data.tracks}
          options={{
            defaultTrack: data.default_track,
            flags: {
              isProgressiveReleaseEnabled: true,
            },
          }}
        />
      )}
    </>
  );
}

export default Releases;
