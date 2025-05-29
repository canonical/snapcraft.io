import { useParams } from "react-router-dom";

// import { setPageTitle } from "../../utils";
import { useQuery } from "react-query";
import { MainTable, Strip, Select, Form } from "@canonical/react-components";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import SectionNav from "../../components/SectionNav";

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

const SnapCveIdCell = ({
  id,
  isExpanded,
  setExpandedRow,
  index,
  hasDescription = false,
}: {
  id: string;
  isExpanded: boolean;
  setExpandedRow: Dispatch<SetStateAction<number | null>>;
  index: number;
  hasDescription?: boolean;
}): JSX.Element => {
  let link: string = "";

  if (id.startsWith("http")) {
    link = id;
  } else if (id.startsWith("CVE")) {
    link = `https://ubuntu.com/security/${id}`;
  }

  return (
    <>
      <button
        className="p-button--base is-dense has-icon"
        style={{ marginRight: "0.5rem", marginLeft: "-0.5rem" }}
        onClick={() => {
          if (isExpanded) {
            setExpandedRow(null);
          } else {
            setExpandedRow(index);
          }
        }}
        aria-expanded={isExpanded}
        disabled={!hasDescription}
      >
        <i
          className={
            isExpanded ? "p-icon--chevron-down" : "p-icon--chevron-right"
          }
        ></i>
      </button>
      {link ? (
        <a target="_blank" rel="noreferrer" href={link}>
          {id}
        </a>
      ) : (
        <span>{id}</span>
      )}
    </>
  );
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
      {fixedVersion && (
        <>
          {" "}
          <span className="u-text--muted" style={{ whiteSpace: "nowrap" }}>
            {fixedVersion}
          </span>
        </>
      )}
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
      width: "20%",
      style: { flexBasis: "20%" },
    },
    {
      content: "Severity",
      width: "10%",
      style: { flexBasis: "10%" },
    },
    { content: "Status", width: "25%", style: { flexBasis: "25%" } },
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
  ];

  const getData = () => {
    return data.map((cve: ICve, index: number) => {
      const columns = [
        {
          content: (
            <SnapCveIdCell
              id={cve.id}
              index={index}
              setExpandedRow={setExpandedRow}
              isExpanded={expandedRow === index}
              hasDescription={!!cve.description}
            />
          ),
          className: "u-truncate",
        },
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
          <SectionNav activeTab="vulnerabilities" snapName={snapId} />
          <Strip shallow>
            <Form inline>
              <Select
                id="revision-selector"
                label="Revision"
                value={currentRevision || ""}
                onChange={(event) => {
                  const selectedRevision = event.target.value;
                  setCurrentRevision(parseInt(selectedRevision));
                }}
                options={revisionSelectOptions}
              />
            </Form>
          </Strip>
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
