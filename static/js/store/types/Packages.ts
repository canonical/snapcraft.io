import type { Category } from "./Category";
import type { Package } from "./Package";

export type Packages = {
  categories: Category[];
  packages: Package[];
  total_items: number;
  total_pages: number;
};
