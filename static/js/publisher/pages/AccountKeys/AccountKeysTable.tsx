import { MainTable, TablePagination } from "@canonical/react-components";
import {
  MainTableHeader,
  MainTableRow,
} from "@canonical/react-components/dist/components/MainTable/MainTable";
import { useMemo } from "react";
import { AccountKeysData } from "../../types/shared";

function AccountKeysTable(props: {
  keys?: AccountKeysData;
}): React.JSX.Element {
  const keys = props.keys ?? [];

  const headers: MainTableHeader[] = useMemo(
    () => [
      { content: "Name", sortKey: "name" },
      { content: "SHA3-384 Fingerprint" },
      { content: "Added", sortKey: "since" },
    ],
    []
  );

  const rows: MainTableRow[] = useMemo(
    () =>
      keys.map((k) => ({
        columns: [
          { content: k.name },
          { content: k["public-key-sha3-384"] },
          { content: new Date(k.since).toLocaleString() },
        ],
        sortData: {
          name: k.name,
          since: new Date(k.since),
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
