export type RouteParams = {
  id: string;
};

export type BrandStores = {
  brandStores: {
    brandStoresList: Stores;
    loading: boolean;
    notFound: boolean;
  };
};

export type CurrentStore = {
  currentStore: {
    currentStore: {
      id: string;
      "manual-review-policy": string;
      private: boolean;
    };
  };
};

export type Snaps = {
  snaps: {
    snaps: Array<{}>;
  };
};

export type InvitesSelector = {
  invites: {
    invites: Invites;
    loading: boolean;
    notFound: boolean;
  };
};

export type Invites = Array<Invite>;

export type Invite = {
  status: "Pending" | "Expired" | "Revoked";
  email: string;
  roles: Array<string>;
  "expiration-date": string;
};

export type MembersList = Array<Member>;

export type Members = {
  members: {
    members: MembersList;
    loading: boolean;
    notFound: boolean;
  };
};

export type Member = {
  displayname: string;
  email: string;
  id: string;
  roles: string[];
  username: string;
  current_user: boolean;
};

export type Store = {
  id?: string;
  name?: string;
};

export type Stores = Array<Store>;

export type Status = "Pending" | "Expired" | "Revoked";
