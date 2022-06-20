// Empty export to mark this file as a module.
// This is required to augment global scope.
export {};

declare global {
  interface Window {
    SENTRY_DSN: string;
    listingData: any;
  }
}
