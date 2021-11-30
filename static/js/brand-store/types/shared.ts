export type RouteParams = {
  id: string;
};

export type Member = {
  current_user: {};
};

export type CurrentMember = {
  displayname: string;
  email: string;
  id: string;
  roles: string[];
  username: string;
};
