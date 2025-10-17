import {
  Button,
  Chip,
  Icon,
  MainTable,
  TablePagination,
} from "@canonical/react-components";
import {
  MainTableHeader,
  MainTableRow,
} from "@canonical/react-components/dist/components/MainTable/MainTable";
import { useMemo, useState } from "react";
import type { AccountKeyData } from "../../types/accountKeysTypes";

const MS_IN_A_DAY = 1000 * 60 * 60 * 24;
const MAX_DATE = new Date(8640000000000000);

function AccountKeyStatus(props: { accountKey: AccountKeyData }) {
  const {
    accountKey: { until: _until },
  } = props;

  const hasUntil = !!_until; // valid keys don't have an "until" value by default
  const until = hasUntil ? new Date(_until) : MAX_DATE;
  const isExpired = until < new Date();
  const willExpireSoon = (until.getTime() - Date.now()) / MS_IN_A_DAY <= 30; // expires in 30 days or less

  const iconName = isExpired
    ? "error"
    : willExpireSoon
      ? "warning"
      : hasUntil
        ? "success"
        : "success-grey";
  const statusText = isExpired
    ? "Expired"
    : willExpireSoon
      ? "Expiring soon"
      : "Valid";
  const untilText = isExpired
    ? `On ${until.toLocaleDateString()}`
    : hasUntil
      ? `Until ${until.toLocaleDateString()}`
      : `No end date`;

  return (
    <p className="u-no-padding u-whitespace-nowrap">
      <Icon name={iconName} style={{ marginRight: "0.5rem" }} />
      <span>{statusText}</span>
      <br />
      <span className="u-text-muted" style={{ marginLeft: "1.5rem" }}>
        {untilText}
      </span>
    </p>
  );
}

function AccountKeyConstraints(props: { accountKey: AccountKeyData }) {
  const {
    accountKey: { constraints },
  } = props;

  const [expanded, setExpanded] = useState(false);

  const [c0, c1 /* ..._*/] = constraints ?? []; // get first two constraints
  const remaining = (constraints?.length ?? 0) - 2;

  return constraints ? (
    <>
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <Button
          // className="u-no-margin"
          style={{ marginRight: "0.5rem" }}
          appearance="base"
          hasIcon
          aria-label={expanded ? "Hide constraints" : "Show constraints"}
          isDense
          onClick={() => setExpanded(!expanded)}
        >
          <Icon name={expanded ? "chevron-down" : "chevron-right"} />
        </Button>
        {c0 && <Chip isReadOnly value={c0.headers.type} />}
        {c1 && <Chip isReadOnly value={c1.headers.type} />}
        {remaining > 0 && <Chip isReadOnly value={`+${remaining}`} />}
      </div>
      {constraints?.length && expanded && (
        <table>
          <thead>
            <tr>
              <th>Assertion type</th>
              <th>Values</th>
            </tr>
          </thead>
          <tbody>
            {constraints.map((c, i) => (
              <tr key={i}>
                <td>{c.headers.type}</td>
                <td className="u-truncate">
                  {c.headers.type === "system-user" ? (
                    typeof c.headers.models === "object" ? (
                      c.headers.models.join(", ")
                    ) : (
                      c.headers.models
                    )
                  ) : c.headers.type === "serial" ||
                    c.headers.type === "model" ||
                    c.headers.type === "preseed" ? (
                    c.headers.model
                  ) : (
                    <span className="u-text-muted">No attribute</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  ) : (
    <span className="u-text-muted">No constraints</span>
  );
}

function AccountKeysTable(props: {
  keys: AccountKeyData[];
}): React.JSX.Element {
  const keys = props.keys ?? [];

  const headers: MainTableHeader[] = useMemo(
    () => [
      { content: "Name", sortKey: "name" },
      { content: "Created", sortKey: "since" },
      { content: "Status", sortKey: "until" },
      { content: "Constraints" },
      { content: "Fingerprint" },
    ],
    [],
  );

  const rows: MainTableRow[] = useMemo(
    () =>
      keys.map(
        (k) =>
          ({
            columns: [
              { content: k.name },
              { content: new Date(k.since).toLocaleDateString() },
              { content: <AccountKeyStatus accountKey={k} /> },
              { content: <AccountKeyConstraints accountKey={k} /> },
              {
                content: k["public-key-sha3-384"],
                className: "u-truncate",
              },
            ],
            sortData: {
              name: k.name,
              since: new Date(k.since),
              until: k.until ? new Date(k.until) : MAX_DATE,
            },
            key: k["public-key-sha3-384"],
          }) as MainTableRow,
      ),
    [keys],
  );

  return (
    <TablePagination data={rows} pageLimits={[10, 25, 50]}>
      <MainTable
        className="u-table-layout--auto"
        headers={headers}
        rows={rows}
        sortable
        defaultSort="since"
        defaultSortDirection="ascending"
        emptyStateMsg="There are no keys associated to your account"
      />
    </TablePagination>
  );
}

export default AccountKeysTable;
