import MultipleInputs from "../../MultipleInputs";
import PrimaryDomainInput from "../../PrimaryDomainInput";

type Props = {
  snapName: string | undefined;
  getFieldState: Function;
  register: Function;
  publisherName: string;
  control: {};
  getValues: Function;
  formState: { [key: string]: any };
};

function ContactInformationSection({
  snapName,
  register,
  control,
  getFieldState,
  getValues,
  formState,
}: Props) {
  return (
    <>
      <div className="u-fixed-width">
        <h2 className="p-heading--4">Contact information</h2>
      </div>

      <PrimaryDomainInput
        snapName={snapName}
        register={register}
        getFieldState={getFieldState}
        getValues={getValues}
        formState={formState}
      />

      <MultipleInputs
        fieldName="websites"
        label="Other websites"
        register={register}
        control={control}
        getFieldState={getFieldState}
      />

      <MultipleInputs
        fieldName="contacts"
        label="Contacts"
        register={register}
        control={control}
        getFieldState={getFieldState}
      />

      <MultipleInputs
        fieldName="donations"
        label="Donations"
        register={register}
        control={control}
        getFieldState={getFieldState}
      />

      <MultipleInputs
        fieldName="source-code"
        label="Source code"
        register={register}
        control={control}
        getFieldState={getFieldState}
      />

      <MultipleInputs
        fieldName="issues"
        label="Issues"
        register={register}
        control={control}
        getFieldState={getFieldState}
      />
    </>
  );
}

export default ContactInformationSection;
