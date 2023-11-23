import { FeaturedPackage } from "./shared";

declare global {
  interface Window {
    featuredSnaps: Array<FeaturedPackage>;
  }
}
