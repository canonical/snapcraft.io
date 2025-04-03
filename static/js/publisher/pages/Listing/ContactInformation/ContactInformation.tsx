import {
  Control,
  UseFormRegister,
  FieldValues,
  UseFormGetFieldState,
  UseFormGetValues,
} from "react-hook-form";

import PrimaryDomainInput from "./PrimaryDomainInput";
import ContactFields from "./ContactFields";

import type { ListingData } from "../../../types";

type Props = {
  data: ListingData;
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues>;
  getFieldState: UseFormGetFieldState<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
};

function ContactInformation({
  data,
  register,
  control,
  getFieldState,
  getValues,
}: Props): React.JSX.Element {
  return (
    <>
      <h2 className="p-heading--4">Contact information</h2>

      <PrimaryDomainInput
        data={data}
        register={register}
        getFieldState={getFieldState}
        getValues={getValues}
      />

      <ContactFields
        register={register}
        control={control}
        labelName="Other websites"
        fieldName="websites"
        getValues={getValues}
      />

      <ContactFields
        register={register}
        control={control}
        labelName="Contacts"
        fieldName="contacts"
        getValues={getValues}
      />

      <ContactFields
        register={register}
        control={control}
        labelName="Donations"
        fieldName="donations"
        getValues={getValues}
      />

      <ContactFields
        register={register}
        control={control}
        labelName="Source code"
        fieldName="source_code"
        getValues={getValues}
      />

      <ContactFields
        register={register}
        control={control}
        labelName="Issues"
        fieldName="issues"
        getValues={getValues}
      />
    </>
  );
}

export default ContactInformation;
