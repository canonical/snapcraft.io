// Empty export to mark this file as a module.
// This is required to augment global scope.
export {};

declare global {
  interface Window {
    SENTRY_DSN: string;
    CSRF_TOKEN: string;
    data: any;
  }
}
