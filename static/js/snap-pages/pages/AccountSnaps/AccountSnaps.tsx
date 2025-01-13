import { Notification, Strip } from "@canonical/react-components";
import RegisteredSnaps from "../../components/RegisteredSnaps";
import PublishedSnapSection from "../../components/PublishedSnapSection";
import { useFetchAccountSnaps } from "../../hooks";

function AccountSnaps() {
  const { status, data, refetch, isRefetching } = useFetchAccountSnaps();
  const isLoading = isRefetching || status === "loading";

  return (
    <div>
      <Strip element="section" shallow>
        <div className="u-fixed-width u-clearfix">
          <h1 className="p-heading--3">Snaps</h1>
          {isLoading && (
            <div className="p-snap-list__account-snaps-loading">
              <i className="p-icon--spinner u-animation--spin"></i>
              <p className="p-snap-list__account-snaps-loading-text">
                Fetching snaps
              </p>
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
}

export default AccountSnaps;
