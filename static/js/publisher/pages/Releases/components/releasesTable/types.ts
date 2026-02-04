import {
  CPUArchitecture,
  Revision,
} from "../../../../types/releaseTypes";

export type DraggedItem = {
  revisions: (Revision | null)[];
  architectures: CPUArchitecture[];
  risk: string;
  branch: string | null;
  type: string;
};
