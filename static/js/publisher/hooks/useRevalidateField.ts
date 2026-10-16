import { useEffect } from "react";
import type {
  UseFormTrigger,
  UseFormClearErrors,
  FieldValues,
} from "react-hook-form";

// Field memoizes registration options, so validate needs an explicit re-run when deps change.
export default function useRevalidateField(
  trigger: UseFormTrigger<FieldValues>,
  clearErrors: UseFormClearErrors<FieldValues>,
  fieldName: string,
  fieldValue: unknown,
  deps: unknown[],
): void {
  useEffect(() => {
    if (fieldValue === "" || fieldValue === null || fieldValue === undefined) {
      clearErrors(fieldName);
    } else {
      void trigger(fieldName);
    }
  }, [fieldValue, trigger, clearErrors, ...deps]);
}
