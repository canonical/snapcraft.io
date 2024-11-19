import type { Category } from "./Category";
import Package from "./Package";

type Store = {
  total_items: number;
  total_pages: number;
  packages: Package[];
  categories: Category[];
};

export default Store;
