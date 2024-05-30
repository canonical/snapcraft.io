type SnapData = {
  sections: {
    display_name: string;
    name: string;
    featured: boolean;
  }[];
  summary: string;
  title: string;
  icon_url: string;
  package_name: string;
  developer_name: string;
  origin: string;
  developer_validation: string;
};

export type { SnapData };
