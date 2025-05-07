import { useParams } from "react-router-dom";

// import { setPageTitle } from "../../utils";
import { useQuery } from "react-query";
import { MainTable, Strip, Select } from "@canonical/react-components";
import { useEffect, useState } from "react";

interface ICve {
  id: string;
  status: string;
  description: string;
  cvss_score: number | null;
  cvss_severity: string | null;
  ubuntu_priority: string | null;
  // affected binary
  name: string;
  version: string;
  fixed_version: string | null;
}

const SnapCveIdCell = ({ id }: { id: string }): JSX.Element => {
  let link: string = "";

  if (id.startsWith("http")) {
    link = id;
  } else if (id.startsWith("CVE")) {
    link = `https://ubuntu.com/security/${id}`;
  }

  if (link) {
    return <a href={link}>{id}</a>;
  } else {
    return <span>{id}</span>;
  }
};

const SnapCveSeverityCell = ({ severity }: { severity: string | null }) => {
  if (!severity) {
    return (
      <>
        <i className="p-icon--help"></i> unknown
      </>
    );
  }

  const severityIcon = `p-icon--${severity}-priority`;

  return (
    <>
      <i className={severityIcon}></i> {severity}
    </>
  );
};

const SnapCveStatusCell = ({
  status,
  fixedVersion,
}: {
  status: string;
  fixedVersion: string | null;
}) => {
  const statusIcon = status === "fixed" ? `p-icon--success` : `p-icon--error`;
  const statusLabel = status === "fixed" ? "fixed" : "vulnerable";
  return (
    <>
      <i className={statusIcon}></i> {statusLabel}
      {fixedVersion && <span className="u-text--muted"> {fixedVersion}</span>}
    </>
  );
};

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

  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const headers = [
    {
      content: "CVE ID",
      width: "15%",
      style: { flexBasis: "15%" },
    },
    {
      content: "Severity",
      width: "10%",
      style: { flexBasis: "10%" },
    },
    { content: "Status", width: "20%", style: { flexBasis: "20%" } },
    {
      content: "Revision",
      width: "10%",
      style: { flexBasis: "10%" },
    },
    {
      content: "Affected source",
      width: "15%",
      style: { flexBasis: "15%" },
    },
    {
      content: "Source version",
      width: "20%",
      style: { flexBasis: "20%" },
    },
    {
      content: "Description",
      width: "10%",
      style: { flexBasis: "10%" },
    },
  ];

  const getData = () => {
    return data.map((cve: ICve, index: number) => {
      const columns = [
        { content: <SnapCveIdCell id={cve.id} /> },
        { content: <SnapCveSeverityCell severity={cve.cvss_severity} /> },
        {
          content: (
            <SnapCveStatusCell
              status={cve.status}
              fixedVersion={cve.fixed_version}
            />
          ),
        },
        { content: currentRevision },
        { content: cve.name },
        { content: cve.version },
        {
          content: (
            <button
              className="p-button is-dense"
              onClick={() => {
                if (expandedRow === index) {
                  setExpandedRow(null);
                } else {
                  setExpandedRow(index);
                }
              }}
              aria-expanded={expandedRow === index}
            >
              {expandedRow === index ? "Hide" : "Show"}
            </button>
          ),
        },
      ] as { content: React.ReactNode; style?: React.CSSProperties }[];
      columns.forEach((column, i) => {
        column.style = headers[i].style;
      });

      return {
        columns,
        expanded: expandedRow === index,
        expandedContent: <p>{cve.description}</p>,
      };
    });
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
            expanding
            paginate={20}
            headers={headers}
            rows={getData()}
          />
        </>
      )}
    </>
  );
}

export default SnapCves;
