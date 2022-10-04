import React, { useState } from "react";
import {
  Strip,
  Accordion,
  StatusLabel,
  Button,
} from "@canonical/react-components";
import { format } from "date-fns";

import PageHeader from "../../../shared/PageHeader";

type Collaborator = {
  account_id: string;
  email: string;
  username: string;
  display_name: string;
  validation: string;
  accepted_at: string;
  is_owner: string;
};

function App() {
  const [data, setData] = useState(window?.data);
  const [collaborators, setCollaborators] = useState(
    window?.data?.collaborators
  );

  return (
    <>
      <PageHeader
        snapName={data.snap_name}
        activeTab="collaboration"
        publisherName={data?.publisher_name}
      />

      <Strip shallow={true}>
        <div className="u-fixed-width app-accordion">
          <Accordion
            expanded="active-shares-table"
            sections={[
              {
                key: "active-shares-table",
                title: `Active shares (${collaborators.length})`,
                content: (
                  <table>
                    <caption className="u-screenreader-only">
                      Users that have accepted an invitation to collaborate on
                      the {data?.snap_name} snap.
                    </caption>
                    <thead>
                      <tr>
                        <th>Users</th>
                        <th>Email</th>
                        <th>Added by</th>
                        <th style={{ width: "120px" }}>Accepted on</th>
                        <th style={{ width: "120px" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {collaborators.map((collaborator: Collaborator) => (
                        <tr key={collaborator?.account_id}>
                          <td data-heading="Users">
                            {collaborator?.display_name}{" "}
                            {collaborator?.is_owner && (
                              <StatusLabel appearance="information">
                                Owner
                              </StatusLabel>
                            )}
                          </td>
                          <td data-heading="Email">{collaborator?.email}</td>
                          <td data-heading="Added by">
                            {collaborator?.is_owner ? "" : "-"}
                          </td>
                          <td data-heading="Accepted on">
                            {format(
                              new Date(collaborator?.accepted_at),
                              "dd/MM/yyyy"
                            )}
                          </td>
                          <td className="u-align--right">
                            {!collaborator?.is_owner && (
                              <Button
                                type="button"
                                dense
                                onClick={() => {
                                  const newCollaborators = collaborators.filter(
                                    (item: Collaborator) =>
                                      item?.is_owner ||
                                      item?.account_id !==
                                        collaborator?.account_id
                                  );

                                  setCollaborators(newCollaborators);
                                }}
                              >
                                Revoke
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ),
              },
            ]}
          />
        </div>
      </Strip>
    </>
  );
}

export default App;
