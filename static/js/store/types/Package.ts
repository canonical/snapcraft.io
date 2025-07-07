import type { Category } from "./Category";

export type Package = {
  id?: string;
  package: {
    description: string;
    display_name: string;
    icon_url?: string;
    name: string;
    platforms?: string[] | null;
    type?: string;
  };
  publisher?: {
    display_name: string;
    name: string;
    validation?: string;
  };
  categories?: Category[];
  ratings?: {
    value: number | null;
    count: number | null;
  };
};
