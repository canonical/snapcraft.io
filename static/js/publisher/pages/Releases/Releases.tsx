import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { Link, Strip } from "@canonical/react-components";

import SectionNav from "../../components/SectionNav";
import Release from "./Release";
import { setPageTitle } from "../../utils";

import { ReleasesAPIResponse } from "../../types/releaseTypes";

function Releases(): React.JSX.Element {
  const { snapId } = useParams();
  const { isLoading, isFetched, data } = useQuery({
    queryKey: ["releases", snapId],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/releases`);

      if (!response.ok) {
        throw new Error("There was a problem fetching releases data");
      }

      const responseData = (await response.json()) as ReleasesAPIResponse;

      if (!responseData.success) {
        throw new Error("There was a problem fetching releases data");
      }

      return responseData.data;
    },
  });

  setPageTitle(`Releases for ${snapId}`);

  return (
    <>
      <h1 className="p-heading--4" aria-live="polite">
        <Link href="/snaps">My snaps</Link> /{" "}
        <Link href={`/${snapId}`}>{snapId}</Link> / Releases
      </h1>

      <SectionNav snapName={snapId} activeTab="releases" />

      {isLoading && (
        <Strip shallow>
          <p>
            <i className="p-icon--spinner u-animation--spin"></i>&nbsp;Loading{" "}
            {snapId} builds data
          </p>
        </Strip>
      )}

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
            snapName: data.snap_name,
          }}
        />
      )}
    </>
  );
}

export default Releases;
