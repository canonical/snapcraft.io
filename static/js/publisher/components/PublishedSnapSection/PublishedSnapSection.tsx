import { useState } from "react";
import { Accordion } from "@canonical/react-components";
import { ISnap } from "../../types";
import PublishedSnapList from "../PublishedSnapList";
import PublisherMetrics from "../PublisherMetrics";
import { ITEMS_PER_PAGE } from "../../constants";

function PublishedSnapSection({
  snaps,
  currentUser,
}: {
  snaps: ISnap[];
  currentUser: string;
}) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const firstItemOfPage = (currentPage - 1) * ITEMS_PER_PAGE;
  const snapsInPage = snaps.slice(
    firstItemOfPage,
    firstItemOfPage + ITEMS_PER_PAGE,
  );

  return (
    <>
      {snaps.length > 0 && (
        <>
          <Accordion
            className="accordion-bold-titles"
            sections={[
              {
                key: "publisher-metrics",
                title: "Snap installs",
                content: <PublisherMetrics snaps={snapsInPage} />,
              },
            ]}
            expanded="publisher-metrics"
          />
          <div className="accordion-actions">
            <div className="accordion-actions__row u-align--right">
              <a
                href="/account/register-snap"
                className="p-button u-float-right p-snap-list__register u-no-margin--top is-dense"
              >
                Register a snap name
              </a>
            </div>
          </div>
        </>
      )}
      <hr className="u-no-margin--bottom" />
      <Accordion
        className="accordion-bold-titles"
        sections={[
          {
            key: "published-snaps-list",
            title: `My published snaps (${snaps.length})`,
            content: (
              <PublishedSnapList
                currentUser={currentUser}
                snaps={snapsInPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalItems={snaps.length}
              />
            ),
          },
        ]}
        expanded="published-snaps-list"
      />
      <hr className="u-no-margin--bottom" />
    </>
  );
}

export default PublishedSnapSection;
