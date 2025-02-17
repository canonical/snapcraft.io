import type { Snap, Member, Store } from "../types/shared";

export const accountResponse = {
  publisher: {
    email: "john.doe@canonical.com",
    fullname: "John Doe",
    has_stores: true,
    indentity_url: "https://login.ubuntu.com/+id/test-user-id",
    image: null,
    is_canonical: true,
    nickname: "johndoe",
  },
};

export const snapsResponse = [
  {
    essential: true,
    id: "test-snap-id",
    "latest-release": {
      channel: "stable",
      revision: 2,
      timestamp: "2018-04-01T12:37:37.926251+00:00",
      version: "1.0.2",
    },
    name: "test-snap-name",
    "other-stores": ["test-other-store-1", "test-other-store-2"],
    private: false,
    store: "test-store-id",
    users: [
      {
        displayname: "John Doe",
        roles: ["owner"],
        username: "johndoe",
      },
    ],
  },
  {
    essential: true,
    id: "test-snap-id-2",
    "latest-release": {
      channel: "stable",
      revision: 2,
      timestamp: "2018-04-01T12:37:37.926251+00:00",
      version: "1.0.2",
    },
    name: "test-snap-name-2",
    "other-stores": ["test-other-store-1", "test-other-store-2"],
    private: false,
    store: "test-store-id",
    users: [
      {
        displayname: "John Doe",
        roles: ["owner"],
        username: "johndoe",
      },
    ],
  },
  {
    essential: false,
    id: "test-snap-id-included",
    "latest-release": {
      channel: "edge",
      revision: 806,
      timestamp: "2025-02-14T10:47:54.153305+00:00",
      version: "0+git.d2171a4",
    },
    name: "test-snap-name-included",
    "other-stores": ["test-other-store-3"],
    private: false,
    store: "ubuntu",
    users: [
      {
        displayname: "Jane Doe",
        roles: ["owner"],
        username: "janedoe",
      },
    ],
  },
] as Snap[];

export const membersResponse = [
  {
    displayname: "John Doe",
    email: "john.doe@canonical.com",
    id: "john-doe-id",
    roles: ["admin", "review", "view", "access"],
    username: "johndoe",
  },
] as Member[];

export const storesResponse = [
  {
    id: "ubuntu",
    name: "Global",
    roles: ["admin", "review", "view", "access"],
    snaps: [],
  },
  {
    id: "test-store-id",
    name: "Test store",
    roles: ["admin", "review", "view", "access"],
    snaps: [],
  },
] as Store[];

export const searchResponse = [
  {
    essential: false,
    id: "test-snap-id-search",
    "latest-release": {
      channel: "edge",
      revision: 806,
      timestamp: "2025-02-14T10:47:54.153305+00:00",
      version: "0+git.d2171a4",
    },
    name: "test-snap-name-search",
    "other-stores": ["test-other-store-3"],
    private: false,
    store: "ubuntu",
    users: [
      {
        displayname: "Jane Doe",
        roles: ["owner"],
        username: "janedoe",
      },
    ],
  },
] as Snap[];
