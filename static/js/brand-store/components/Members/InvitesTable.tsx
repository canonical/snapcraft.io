import {
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { MainTable, Button } from "@canonical/react-components";

import InviteModal from "./InviteModal";

import { fetchInvites } from "../../slices/invitesSlice";
import ROLES from "./memberRoles";

import type { Invite, InvitesList, Status } from "../../types/shared";

type Props = {
  invites: any;
  setShowSuccessNotification: Dispatch<SetStateAction<boolean>>;
  setNotificationText: Dispatch<SetStateAction<string>>;
  setShowErrorNotification: Dispatch<SetStateAction<boolean>>;
};

function InvitesTable({
  invites,
  setShowSuccessNotification,
  setNotificationText,
  setShowErrorNotification,
}: Props): ReactNode {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [expiredInvites, setExpiredInvites] = useState([]);
  const [revokedInvites, setRevokedInvites] = useState([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteActionData, setInviteActionData]: any = useState({});
  const [inviteModalIsSaving, setInviteModalIsSaving] = useState(false);
  const { id } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    setPendingInvites(
      invites.filter((invite: Invite) => invite.status === "Pending")
    );
    setExpiredInvites(
      invites.filter((invite: Invite) => invite.status === "Expired")
    );
    setRevokedInvites(
      invites.filter((invite: Invite) => invite.status === "Revoked")
    );
  }, [invites]);

  const updateInvite = (inviteData: Invite) => {
    const data = new FormData();

    data.set("csrf_token", window.CSRF_TOKEN);
    data.set("invites", JSON.stringify([inviteData]));

    setInviteModalIsSaving(true);

    fetch(`/admin/store/${id}/invite/update`, {
      method: "POST",
      body: data,
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          throw Error();
        }
      })
      .then(() => {
        dispatch(fetchInvites(id as string) as any);
        setTimeout(() => {
          setInviteModalOpen(false);
          setInviteModalIsSaving(false);
          setInviteActionData({});
          setNotificationText("The invite status has been updated");
          setShowSuccessNotification(true);
        }, 1500);
      })
      .catch(() => {
        setInviteModalOpen(false);
        setInviteModalIsSaving(false);
        setInviteActionData({});
        setShowErrorNotification(true);
      });
  };

  const getInviteStatusText = (status: Status) => {
    let iconClassName = "";

    if (status === "Pending") {
      iconClassName = "p-icon--status-waiting";
    }

    if (status === "Expired") {
      iconClassName = "p-icon--warning";
    }

    if (status === "Revoked") {
      iconClassName = "p-icon--error";
    }

    return (
      <>
        <i className={iconClassName} /> {status}
      </>
    );
  };

  const getRolesText = (roles: Array<string>) => {
    let rolesText = "";

    roles.forEach((role, index) => {
      rolesText += ROLES[role].name;

      if (index < roles.length - 1) {
        rolesText += " | ";
      }
    });

    return rolesText;
  };

  const buildTableCols = (invite: Invite) => {
    return [
      {
        "aria-label": "Email",
        content: invite.email,
        className: "u-truncate",
      },
      {
        "aria-label": "Expires",
        content: format(new Date(invite["expiration-date"]), "dd/MM/yyyy"),
      },
      {
        "aria-label": "Roles",
        content: getRolesText(invite.roles),
      },
      {
        "aria-label": "Actions",
        className: "u-align--right",
        content:
          invite.status === "Pending" ? (
            <>
              <Button
                className="invite-action-button"
                onClick={() => {
                  setInviteActionData({
                    email: invite.email,
                    action: "resend",
                  });
                  setInviteModalOpen(true);
                }}
              >
                Resend
              </Button>
              <Button
                className="invite-action-button"
                onClick={() => {
                  setInviteActionData({
                    email: invite.email,
                    action: "revoke",
                  });
                  setInviteModalOpen(true);
                }}
              >
                Revoke
              </Button>
            </>
          ) : (
            <Button
              className="invite-action-button"
              onClick={() => {
                setInviteActionData({ email: invite.email, action: "open" });
                setInviteModalOpen(true);
              }}
            >
              Reopen
            </Button>
          ),
      },
    ];
  };

  const buildTableRows = (invitesGroup: InvitesList) => {
    return invitesGroup.map((invite, index) => {
      if (index === 0) {
        return {
          columns: [
            {
              "aria-label": "Status",
              content: getInviteStatusText(invite.status),
              rowSpan: invitesGroup.length,
            },
            ...buildTableCols(invite),
          ],
        };
      } else {
        return {
          columns: buildTableCols(invite),
        };
      }
    });
  };

  const pendingInviteRows = buildTableRows(pendingInvites);
  const expiredInviteRows = buildTableRows(expiredInvites);
  const revokedInviteRows = buildTableRows(revokedInvites);

  return (
    <>
      <MainTable
        responsive={true}
        headers={[
          { content: "Status", style: { width: "15%" } },
          { content: "Email" },
          { content: "Expires", style: { width: "15%" } },
          { content: "Roles" },
          { content: "", style: { width: "20%" } },
        ]}
        rows={[
          ...pendingInviteRows,
          ...expiredInviteRows,
          ...revokedInviteRows,
        ]}
      />
      <InviteModal
        inviteActionData={inviteActionData}
        inviteModalOpen={inviteModalOpen}
        setInviteModalOpen={setInviteModalOpen}
        updateInvite={updateInvite}
        inviteModalIsSaving={inviteModalIsSaving}
      />
    </>
  );
}

export default InvitesTable;
