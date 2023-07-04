export type RouteParams = {
  id: string;
};

export type Status = "Pending" | "Expired" | "Revoked";

// Slices
export type CurrentStoreSlice = {
  currentStore: {
    currentStore: {
      id: string;
      "manual-review-policy": string;
      private: boolean;
    };
  };
};

export type InvitesSlice = {
  invites: {
    invites: InvitesList;
    loading: boolean;
    notFound: boolean;
  };
};

export type MembersSlice = {
  members: {
    members: MembersList;
    loading: boolean;
    notFound: boolean;
  };
};

export type SnapsSlice = {
  snaps: {
    snaps: SnapsList;
    loading: boolean;
    notFound: boolean;
  };
};

export type StoresSlice = {
  brandStores: {
    brandStoresList: StoresList;
    loading: boolean;
    notFound: boolean;
  };
};

// Item lists
export type InvitesList = Array<Invite>;
export type MembersList = Array<Member>;
export type SnapsList = Array<Snap>;
export type StoresList = Array<Store>;

// Entities
export type Invite = {
  status: "Pending" | "Expired" | "Revoked";
  email: string;
  roles: Array<string>;
  "expiration-date": string;
};

export type Member = {
  displayname: string;
  email: string;
  id: string;
  roles: string[];
  username: string;
  current_user: boolean;
};

export type Snap = {
  essential: boolean;
  id: string;
  "included-stores": Array<string>;
  "latest-release": {
    channel: string;
    revision: number;
    timestamp: string;
    version: string;
  };
  name: string;
  "other-stores": Array<string>;
  private: boolean;
  store: string;
  users: Array<Member>;
};

export type Store = {
  id: string;
  name: string;
  roles: Array<"admin" | "review" | "view" | "access">;
  snaps: SnapsList;
  userHasAccess: boolean;
};

export type Model = {
  name: string;
  "api-key": string;
  "created-at": string;
  "created-by": string;
  "modified-at": string;
  "modified-by": string;
};
