import {
  Link,
  MainTable,
  Pagination,
  Strip,
} from "@canonical/react-components";
import { ISnap } from "../../types";
import SnapNameEntry from "./SnapNameEntry";
import NewSnapNotification from "../NewSnapNotification";
import EmptySnapList from "../EmptySnapList";
import { PAGE_NUMBER } from "../../types/constants";

function PublishedSnapList({
  snaps,
  currentUser,
  currentPage,
  setCurrentPage,
  totalItems,
}: {
  snaps: ISnap[];
  currentUser: string;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalItems: number;
}) {
  const shouldShowNewSnapNotification =
    snaps && snaps.length === 1 && snaps[0].is_new;

  const getData = () => {
    return snaps.map((snap) => ({
      columns: [
        {
          content: <SnapNameEntry snap={snap} />,
          role: "rowheader",
          className: "p-table--mobile-card__header",
        },
        {
          content: snap.unlisted
            ? "Unlisted"
            : snap.private
              ? "Private"
              : "Public",
          "aria-label": "Visibility",
        },
        {
          content:
            snap.publisher.username === currentUser
              ? "You"
              : snap.publisher["display-name"],
          "aria-label": "Owner",
        },
        {
          content: (
            <div>
              {snap.latest_release?.status == "Published" ? (
                snap.latest_release?.channels[0]
              ) : (
                <Link href={`/${snap.snapName}/releases`}>Not released</Link>
              )}
            </div>
          ),
          "aria-label": "Latest release",
        },
        {
          content: (
            <div>
              {snap.latest_release?.status == "Published" ? (
                <Link href={`/${snap.snapName}/releases`}>
                  {snap.latest_release?.version}
                </Link>
              ) : (
                ""
              )}
            </div>
          ),
          "aria-label": "Version",
        },
      ],
    }));
  };

  const isEmpty = snaps && snaps.length === 0;

  return (
    <Strip element="section" shallow>
      <div className="u-fixed-width u-clearfix">
        <h2 className="p-heading--4 u-float-left">My published snaps</h2>
        <Link
          href="/account/register-snap"
          className="p-button u-float-right p-snap-list__register u-no-margin--top"
        >
          Register a snap name
        </Link>
      </div>
      {isEmpty && <EmptySnapList />}

      {shouldShowNewSnapNotification && <NewSnapNotification snap={snaps[0]} />}

      {snaps.length > 0 && (
        <div className="u-fixed-width">
          <MainTable
            headers={[
              {
                content: "Name",
                width: "20%",
              },
              {
                content: "Visibility",
                width: "10%",
              },
              {
                content: "Owner",
                width: "10%",
              },
              {
                content: "Latest release",
                width: "10%",
              },
              {
                content: "Version",
                width: "10%",
              },
            ]}
            rows={getData()}
          />
          <Pagination
            currentPage={currentPage}
            itemsPerPage={PAGE_NUMBER}
            paginate={(page) => {
              setCurrentPage(page);
            }}
            totalItems={totalItems}
          />
        </div>
      )}
    </Strip>
  );
}

export default PublishedSnapList;