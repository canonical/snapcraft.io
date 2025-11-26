type Route = {
  path: string;
  label?: string;
  children?: Route[];
};

// TODO: this should be tied to the ACTUAL routes... maybe move to data routing?
const routes: Route[] = [
  {
    path: ":snapId",
    label: ":snapId",
    children: [
      {
        path: "listing",
        label: "Listing",
      },
      {
        path: "builds",
        label: "Builds",
        children: [
          {
            path: ":buildId",
            label: "Build #:buildId",
          },
        ],
      },
      {
        path: "releases",
        label: "Releases",
      },
      {
        path: "metrics",
        label: "Metrics",
      },
      {
        path: "publicise",
        label: "Publicise",
        children: [
          {
            path: "badges",
          },
          {
            path: "cards",
          },
        ],
      },
      {
        path: "settings",
        label: "Settings",
      },
    ],
  },
];

export default routes;
