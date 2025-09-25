/**
 * All of these types are based on the validation rules used in SCA and SAS
 */

// simple headers don't need anything
export type SimpleHeader = {
  type:
    | "account"
    | "account-key"
    | "snap-build"
    | "snap-declaration"
    | "snap-revision"
    | "store"
    | "validation"
    | "validation-set";
};

// these need a "model" member that is a string
export type SerialModelPreseedHeader = {
  type: "serial" | "model" | "preseed";
  model: string;
};

// this one accepts either a model or a list of models
export type SystemUserHeader = {
  type: "system-user";
  models: string | string[];
};

export type AccountKeyConstraint = {
  headers: SerialModelPreseedHeader | SimpleHeader | SystemUserHeader;
};

export type AccountKeyData = {
  name: string;
  "public-key-sha3-384": string;
  since: string;
  until?: string; // not all keys have an expiry date
  constraints?: AccountKeyConstraint[]; // not all keys are limited
};
