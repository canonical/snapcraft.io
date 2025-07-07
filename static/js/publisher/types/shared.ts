export type RouteParams = {
  id: string;
};

export type Status = "Pending" | "Expired" | "Revoked";

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

export type InviteActionData = {
  action: "resend" | "revoke" | "open";
  email: string;
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
  userHasAccess?: boolean;
};

export type Store = {
  id: string;
  name: string;
  roles?: Array<"admin" | "review" | "view" | "access">;
  snaps: SnapsList;
  userHasAccess?: boolean;
  includedStore?: {
    id: string;
    name: string;
    userHasAccess: boolean;
  };
};

export type Model = {
  name: string;
  "api-key": string;
  "created-at": string;
  "created-by"?: {
    "display-name": string;
    email: string;
    id: string;
    username: string;
    validation: string;
  };
  "modified-at"?: string | null;
  "modified-by"?: {
    "display-name": string;
    email: string;
    id: string;
    username: string;
    validation: string;
  } | null;
  "policy-revision"?: number | undefined;
  series?: string;
};

export type Policy = {
  "created-at": string;
  "created-by": {
    "display-name": string;
    email: string;
    id: string;
    username: string;
    validation: string;
  } | null;
  "model-name": string;
  revision: number;
  "signing-key-sha3-384": string;
  "signing-key-name"?: string;
  "modified-at"?: string | null;
  "modified-by"?: {
    "display-name": string;
    email: string;
    id: string;
    username: string;
    validation: string;
  } | null;
};

export type SigningKey = {
  name: string;
  "created-at": string;
  "created-by"?: {
    "display-name": string;
    email: string;
    id: string;
    username: string;
    validation: string;
  } | null;
  "modified-at": string | null;
  "modified-by"?: {
    "display-name": string;
    email: string;
    id: string;
    username: string;
    validation: string;
  } | null;
  fingerprint?: string;
  "sha3-384"?: string;
  models?: Array<string>;
  policies?: Array<Policy>;
};

export type Publisher = {
  email: string;
  fullname: string;
  has_stores?: boolean;
  identity_url: string;
  image: string | null;
  is_canonical: boolean;
  nickname: string;
  subscriptions: {
    newsletter: boolean;
  } | null;
} | null;

export type UsePoliciesResponse = {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  isSuccess: boolean;
  data: Policy[] | undefined;
};

export type ApiError = {
  message: string;
};

export type EventFunction<T> = (value: T) => void;

export type AvailableStores = {
  name: string;
  id: string;
  roles: string[];
}[];

export type TerritoriesMetricsData = {
  [key: string]: {
    code: string;
    color_rgb: number[];
    name: string;
    number_of_users: number;
    percentage_of_users: number;
  };
};
