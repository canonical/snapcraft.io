const progressiveTypes = {
  RELEASE: "Release",
  UPDATE: "Update",
  CANCELLATION: "Cancel",
} as const;

export type ProgressiveType = typeof progressiveTypes[keyof typeof progressiveTypes];

export default progressiveTypes;
