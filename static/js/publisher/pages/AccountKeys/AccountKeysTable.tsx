import { MainTable, TablePagination } from "@canonical/react-components";
import {
  MainTableHeader,
  MainTableRow,
} from "@canonical/react-components/dist/components/MainTable/MainTable";
import { useMemo } from "react";
import type { AccountKeysData } from "../../types/accountKeysTypes";

function AccountKeysTable(props: {
  keys?: AccountKeysData;
}): React.JSX.Element {
  const keys = props.keys ?? [];

  const headers: MainTableHeader[] = useMemo(
    () => [
      { content: "Name", sortKey: "name" },
      { content: "Created date", sortKey: "since" },
      { content: "Valid until", sortKey: "until" },
      { content: "Fingerprint" },
    ],
    []
  );

  const rows: MainTableRow[] = useMemo(
    () =>
      keys.map((k) => ({
        columns: [
          { content: k.name },
          { content: new Date(k.since).toLocaleDateString() },
          { content: k.until ? new Date(k.until).toLocaleDateString() : "-" },
          { content: k["public-key-sha3-384"] },
          // TODO: how do we show the constraints list? tooltip? modal? something else?
        ],
        sortData: {
          name: k.name,
          since: new Date(k.since),
          until: k.until ? new Date(k.until) : new Date(8640000000000000),
        },
        key: k["public-key-sha3-384"],
      })),
    [keys]
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
