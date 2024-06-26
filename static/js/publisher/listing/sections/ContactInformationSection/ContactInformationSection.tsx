import MultipleInputs from "../../components/MultipleInputs";
import ListingFormInput from "../../components/ListingFormInput";

type Props = {
  getFieldState: Function;
  register: Function;
  publisherName: string;
  control: {};
};

function ContactInformationSection({
  register,
  control,
  getFieldState,
}: Props) {
  return (
    <>
      <div className="u-fixed-width">
        <h2 className="p-heading--4">Contact information</h2>
      </div>

      <ListingFormInput
        label="Primary website"
        name="primary_website"
        register={register}
        getFieldState={getFieldState}
        type="url"
        colSize={5}
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
