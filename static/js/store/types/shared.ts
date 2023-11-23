export type Package = {
  id?: string;
  package: {
    description: string;
    display_name: string;
    icon_url?: string;
    name: string;
    platforms?: Array<string> | null;
    type?: string;
    charms?: Array<{
      name: string;
      display_name: string;
    }>;
  };
  publisher?: {
    display_name: string;
    name: string;
    validation?: string;
  };
  categories?: Array<{
    display_name: string;
    name: string;
  }>;
  ratings?: {
    value: number | null;
    count: number | null;
  };
};

export type FeaturedPackage = {
  apps: Array<string>;
  architecture: Array<string>;
  developer_id: string;
  developer_name: string;
  developer_validation: string;
  media: Array<{
    height: number;
    type: string;
    url: string;
    width: number;
  }>;
  origin: string;
  package_name: string;
  sections: Array<{
    featured: Boolean;
    name: string;
  }>;
  summary: string;
  title: string;
};
