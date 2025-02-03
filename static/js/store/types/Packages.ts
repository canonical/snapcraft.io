import type { Category } from "./Category";
import type { Package } from "./Package";

export type Packages = {
  total_items: number;
  total_pages: number;
  packages: Package[];
  categories: Category[];
};
