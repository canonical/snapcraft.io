import { Notification, Strip } from "@canonical/react-components";
import { RegisteredSnaps } from "../../components/RegisteredSnaps";
import { PublishedSnapSection } from "../../components/PublishedSnapSection";
import { useFetchAccountSnaps } from "../../hooks";

// add pagination (done)
// show only that page's graph (done)
// try to get 500 error with graph? tried with 1500 snaps
// no need - optimize graph? where the limited amount of snap is shown bu only some important data is shown in the graph less data points
// kinda done - clear out the code (react query updated, error loading states updated)
// tests => today
export const AccountSnaps = () => {
  const { status, data, refetch, isRefetching } = useFetchAccountSnaps();
  const isLoading = isRefetching || status === "loading";

  return (
    <div>
      <Strip element="section" shallow>
        <div className="u-fixed-width u-clearfix">
          <h1 className="p-heading--3">Snaps</h1>
          {isLoading && (
            <div>
              <i className="p-icon--spinner u-animation--spin"></i>
              <p>Fetching snaps</p>
            </div>
          )}

          {status === "error" && (
            <div className="u-fixed-width">
              <Notification severity="negative" title="Error:">
                Something went wrong. Please try again later.
              </Notification>
            </div>
          )}
        </div>
      </Strip>

      {data?.snaps && !isLoading && (
        <PublishedSnapSection
          currentUser={data.currentUser}
          snaps={data.snaps}
        />
      )}

      {data?.registeredSnaps &&
        data.registeredSnaps.length > 0 &&
        !isLoading && (
          <RegisteredSnaps
            snaps={data.registeredSnaps}
            currentUser={data.currentUser}
            refetchSnaps={() => {
              refetch({ queryKey: "accountSnaps" });
            }}
          />
        )}
    </div>
  );
};
