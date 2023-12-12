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
