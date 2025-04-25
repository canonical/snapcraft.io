import { useParams } from "react-router-dom";

// import { setPageTitle } from "../../utils";
import { useQuery } from "react-query";
import { MainTable, Strip, Select } from "@canonical/react-components";
import { useEffect, useState } from "react";

interface ICve {
  id: string;
  description: string;
  cvss_score: number | null;
  cvss_severity: string | null;
  ubuntu_priority: string | null;
}

function SnapCves(): JSX.Element {
  const { snapId } = useParams();
  const [currentRevision, setCurrentRevision] = useState<number | null>(null);
  const { data: revisionsData, isLoading: isRevisionsLoading } = useQuery({
    queryKey: ["snapRevisions", snapId],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/cves`);
      if (!response.ok) {
        throw new Error("There was a problem fetching listing data");
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    },
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    cacheTime: 1000 * 60 * 60 * 12, // 12 hours
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!currentRevision && revisionsData?.revisions?.length) {
      setCurrentRevision(revisionsData.revisions[0]);
    }
  }, [currentRevision, revisionsData]);

  const { data, isLoading: isCvesLoading } = useQuery({
    queryKey: ["cves", snapId, currentRevision],
    queryFn: async () => {
      const response = await fetch(`/api/${snapId}/${currentRevision}/cves`);

      if (!response.ok) {
        throw new Error("There was a problem fetching listing data");
      }
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data;
    },
    enabled: !!currentRevision,
    staleTime: 1000 * 60 * 60 * 12, // 12 hours
    cacheTime: 1000 * 60 * 60 * 12, // 12 hours
    refetchOnWindowFocus: false,
  });

  const getData = () => {
    return data.map((cve: ICve) => ({
      columns: [
        { content: cve.id },
        { content: cve.cvss_score },
        { content: cve.cvss_severity },
        { content: cve.ubuntu_priority },
        { content: cve.description },
      ],
    }));
  };

  console.table(data);
  //   setPageTitle(`Listing data for ${snapId}`);

  const isLoading = isCvesLoading || isRevisionsLoading;

  const revisionSelectOptions = revisionsData?.revisions.map(
    (revision: string) => ({
      label: revision,
      value: revision,
    })
  );

  return (
    <>
      <h1 className="p-heading--4" aria-live="polite">
        <a href="/snaps">My snaps</a> / <a href={`/${snapId}`}>{snapId}</a> /
        CVEs
      </h1>

      {isLoading && (
        <Strip shallow>
          <p>
            <i className="p-icon--spinner u-animation--spin"></i>&nbsp;Loading{" "}
            {snapId} CVE data
          </p>
        </Strip>
      )}

      {data && (
        <>
          <div>
            <Select
              //className="p-form__control"
              //disabled={isEmpty}
              value={currentRevision || ""}
              onChange={(event) => {
                const selectedRevision = event.target.value;
                // Handle the revision change here
                console.log("Selected revision:", selectedRevision);
                setCurrentRevision(parseInt(selectedRevision));
              }}
              options={revisionSelectOptions}
            />
          </div>
          <MainTable
            headers={[
              { content: "ID", width: "15%" },
              { content: "CVSS score", width: "15%" },
              { content: "CVSS severity", width: "15%" },
              { content: "Ubuntu priority", width: "15%" },
              { content: "Description", width: "40%" },
            ]}
            rows={getData()}
          />
        </>
      )}
    </>
  );
}

export default SnapCves;
