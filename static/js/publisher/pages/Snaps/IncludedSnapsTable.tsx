import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Input, MainTable } from "@canonical/react-components";

import type { SnapsList, Store, Snap } from "../../types/shared";

type GetStoreNameFunc = (storeId: string) => string | undefined;
type IsOnlyViewerFunc = () => boolean;
type SetSnapsToRemoveFunc = (snaps: SnapsList) => void;

type IncludedSnapsTableRowsProps = {
  snaps: Array<Snap>;
  getStoreName?: GetStoreNameFunc;
  isGlobal?: boolean;
  isOnlyViewer: IsOnlyViewerFunc;
  snapsToRemove: SnapsList;
  setSnapsToRemove: SetSnapsToRemoveFunc;
};

function SnapTableRows({
  snaps,
  getStoreName,
  isGlobal,
  isOnlyViewer,
  snapsToRemove,
  setSnapsToRemove,
}: IncludedSnapsTableRowsProps) {
  const { id } = useParams();

  return snaps.map((snap) => {
    const snapName = isGlobal ? (
      <a href={`https://snapcraft.io/${snap.name}`}>{snap.name}</a>
    ) : (
      snap.name || "-"
    );

    const isChecked = snapsToRemove.some((item: Snap) => item.id === snap.id);

    let latestReleaseVersion = "-";
    if (snap["latest-release"] && snap["latest-release"].version) {
      latestReleaseVersion = snap["latest-release"].version || "-";
    }

    let releaseDate = null;
    if (snap["latest-release"] && snap["latest-release"].timestamp) {
      releaseDate = parseISO(snap["latest-release"].timestamp);
    }

    const publisher = snap.users[0].displayname.toLowerCase();

    return {
      columns: [
        {
          content:
            snap.store !== id && !snap.essential && !isOnlyViewer() ? (
              <div
                className={`u-truncate ${isOnlyViewer() ? "" : "table-cell-checkbox"}`}
              >
                <Input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSnapsToRemove([...snapsToRemove, snap]);
                    } else {
                      setSnapsToRemove(
                        snapsToRemove.filter((item) => item.id !== snap.id),
                      );
                    }
                  }}
                  checked={isChecked}
                  label={snapName}
                />
              </div>
            ) : (
              <div className="brand-store-table-no-checkbox">
                <span style={{ marginLeft: "2rem" }}>{snapName}</span>
              </div>
            ),
        },
        {
          content: isGlobal
            ? "Global"
            : (getStoreName && getStoreName(snap.store)) || snap.store,
          className: "brand-store-table-content",
        },
        {
          content:
            snap["latest-release"] && snap["latest-release"].version
              ? snap["latest-release"].version
              : "-",
          className: "brand-store-table-content",
        },
        {
          content: releaseDate ? format(releaseDate, "dd/MM/yyyy") : "-",
          className: "brand-store-table-content",
        },
        {
          content: snap.users[0].displayname,
          className: "brand-store-table-content",
        },
      ],
      sortData: {
        name: snap.name,
        sourceStore: snap.store,
        latestRelease: latestReleaseVersion || null,
        releaseDate: releaseDate || null,
        publisher: publisher,
      },
    };
  });
}

type IncludedSnapsTableProps = {
  isOnlyViewer: IsOnlyViewerFunc;
  snapsToRemove: SnapsList;
  setSnapsToRemove: SetSnapsToRemoveFunc;
  globalStore: Store | null;
  nonEssentialSnapIds: string[];
  getStoreName: GetStoreNameFunc;
  otherStores: Array<{
    id: string;
    name: string;
    snaps: Array<Snap>;
  }>;
};

function IncludedSnapsTable({
  isOnlyViewer,
  snapsToRemove,
  setSnapsToRemove,
  globalStore,
  nonEssentialSnapIds,
  getStoreName,
  otherStores,
}: IncludedSnapsTableProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  const otherStoresSnaps = otherStores.map((item) => item?.snaps);
  const allSnaps = otherStoresSnaps.flat().concat(globalStore?.snaps ?? []);

  const deDupedSnaps = (snaps: Array<Snap>, sourceStoreId: string) => {
    return snaps.filter((snap) => snap.store === sourceStoreId);
  };

  useEffect(() => {
    if (snapsToRemove.length) {
      if (snapsToRemove.length === nonEssentialSnapIds.length) {
        setIsChecked(true);
        setIsIndeterminate(false);
      } else {
        setIsChecked(false);
        setIsIndeterminate(true);
      }
    } else {
      setIsChecked(false);
      setIsIndeterminate(false);
    }
  }, [snapsToRemove]);

  return (
    <MainTable
      sortable
      headers={[
        {
          content: !isOnlyViewer() ? (
            <div
              className={`u-truncate ${isOnlyViewer() ? "" : "table-cell-checkbox"}`}
            >
              <Input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSnapsToRemove(
                      allSnaps.filter((item) => !item.essential),
                    );
                    setIsChecked(true);
                  } else {
                    setSnapsToRemove([]);
                    setIsChecked(false);
                  }
                }}
                disabled={!nonEssentialSnapIds.length}
                label="Name"
                checked={isChecked}
                // @ts-expect-error - The Input component does not support the 'indeterminate' prop.
                indeterminate={isIndeterminate}
              />
            </div>
          ) : (
            "Name"
          ),
          sortKey: "name",
        },
        {
          content: "Source store",
          sortKey: "sourceStore",
          className: "brand-store-table-header",
        },
        {
          content: "Latest release",
          sortKey: "latestRelease",
          className: "brand-store-table-header",
        },
        {
          content: "Release date",
          sortKey: "releaseDate",
          className: "brand-store-table-header",
        },
        {
          content: "Publisher",
          sortKey: "publisher",
          className: "brand-store-table-header",
        },
      ]}
      rows={otherStores
        .map((store) =>
          SnapTableRows({
            snaps: deDupedSnaps(store.snaps, store.id),
            getStoreName,
            isOnlyViewer,
            snapsToRemove,
            setSnapsToRemove,
          }),
        )
        .flat()
        .concat(
          ...SnapTableRows({
            snaps: globalStore ? deDupedSnaps(globalStore.snaps, "ubuntu") : [],
            isGlobal: true,
            isOnlyViewer,
            snapsToRemove,
            setSnapsToRemove,
          }),
        )}
    />
  );
}

export default IncludedSnapsTable;
