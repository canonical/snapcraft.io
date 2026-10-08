import { useEffect, useState } from "react";
import { Notification } from "@canonical/react-components";
import RegisteredSnaps from "../../components/RegisteredSnaps";
import PublishedSnapSection from "../../components/PublishedSnapSection";
import { useFetchAccountSnaps } from "../../hooks";

function AccountSnaps() {
  const { status, data, refetch, isRefetching } = useFetchAccountSnaps();
  const isLoading = isRefetching || status === "loading";
  const [notifications, setNotifications] = useState(
    () => window.PUBLISHER_FLASH_MESSAGES || [],
  );

  useEffect(() => {
    window.PUBLISHER_FLASH_MESSAGES = [];
    const timeout = setTimeout(() => {
      setNotifications((messages) =>
        messages.filter(([category]) => category !== "positive"),
      );
    }, 10000);
    return () => clearTimeout(timeout);
  }, []);

  document.title = "My published snaps — Linux software in the Snap Store";

  return (
    <>
      <div className="u-fixed-width u-clearfix">
        <h1 className="p-heading--4">My snaps / Overview</h1>
        {notifications.map(([category, message], index) => (
          <Notification
            key={`${category}-${message}-${index}`}
            severity={
              category === "positive"
                ? "positive"
                : category === "negative"
                  ? "negative"
                  : "information"
            }
            onDismiss={() => {
              setNotifications((messages) =>
                messages.filter((_, messageIndex) => messageIndex !== index),
              );
            }}
          >
            {message}
          </Notification>
        ))}
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
    </>
  );
}

export default AccountSnaps;
