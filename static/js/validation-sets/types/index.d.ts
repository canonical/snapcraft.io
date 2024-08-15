export type Snap = {
  id: string;
  name: string;
  revision?: number;
  presence?: string;
};

export type ValidationSet = {
  name: string;
  revision?: number;
  sequence?: number;
  snaps: Snap[];
  timestamp: string;
};
