import { useState } from "react";
import { ISnap } from "../../types";
import { PublishedSnapList } from "../PublishedSnapList";
import { PublisherMetrics } from "../PublisherMetrics";
import { PAGE_NUMBER } from "../../types/constants";

export const PublishedSnapSection = ({
  snaps,
  currentUser,
}: {
  snaps: ISnap[];
  currentUser: string;
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const firstItemOfPage = (currentPage - 1) * PAGE_NUMBER;
  const snapsInPage = snaps.slice(
    firstItemOfPage,
    firstItemOfPage + PAGE_NUMBER
  );

  return (
    <>
      {snaps.length > 0 && <PublisherMetrics snaps={snapsInPage} />}

      <PublishedSnapList
        currentUser={currentUser}
        snaps={snapsInPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalItems={snaps.length}
      />
    </>
  );
};
