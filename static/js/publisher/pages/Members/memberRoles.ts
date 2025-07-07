interface Roles {
  [key: string]: {
    [key: string]: string;
  };
}

const ROLES: Roles = {
  admin: {
    name: "Admin",
    description:
      "Admins manage the store's users and roles, and control the store's settings.",
  },
  review: {
    name: "Reviewer",
    description:
      "Reviewers can approve or reject snaps, and edit snap declarations.",
  },
  view: {
    name: "Viewer",
    description:
      "Viewers are read-only users and can view snap details, metrics, and the contents of this store.",
  },
  access: {
    name: "Publisher",
    description:
      "Publishers can invite collaborators to a snap, publish snaps and update snap details.",
  },
};

export default ROLES;
