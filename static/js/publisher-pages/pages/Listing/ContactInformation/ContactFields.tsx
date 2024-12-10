import {
  Control,
  FieldValues,
  useFieldArray,
  UseFormGetValues,
  UseFormRegister,
} from "react-hook-form";
import { Row, Col, Button, Icon } from "@canonical/react-components";

type Props = {
  register: UseFormRegister<FieldValues>;
  control: Control<FieldValues>;
  labelName: string;
  fieldName: string;
  getValues: UseFormGetValues<FieldValues>;
};

function ContactFields({
  register,
  control,
  labelName,
  fieldName,
  getValues,
}: Props): JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  return (
    <>
      {fields.length === 0 && (
        <Row className="p-form__group">
          <Col size={2}>
            <label htmlFor={fieldName}>{labelName}:</label>
          </Col>
          <Col size={5}>
            <Button
              type="button"
              appearance="link"
              onClick={() => {
                append({ url: "" });
              }}
            >
              +&nbsp;Add field
            </Button>
          </Col>
        </Row>
      )}

      {fields.map((field, index) => (
        <Row className="p-form__group" key={field.id}>
          {index === 0 && (
            <Col size={2}>
              <label htmlFor={fieldName}>{labelName}:</label>
            </Col>
          )}
          <Col size={5} emptyLarge={index === 0 ? undefined : 3}>
            <div className="p-form__control">
              <input
                type="url"
                {...register(`${fieldName}.${index}.url`)}
                defaultValue={getValues(`${fieldName}.${index}.url`)}
              />
            </div>
          </Col>
          <Col size={2}>
            <Button
              type="button"
              appearance="base"
              onClick={() => {
                remove(index);
              }}
            >
              <Icon name="delete" />
              <span className="u-off-screen">Remove this link</span>
            </Button>
          </Col>
        </Row>
      ))}

      {fields.length > 0 && (
        <Row>
          <Col size={5} emptyLarge={3}>
            <Button
              type="button"
              appearance="link"
              onClick={() => {
                append({ url: "" });
              }}
            >
              +&nbsp;Add field
            </Button>
          </Col>
        </Row>
      )}
    </>
  );
}

export default ContactFields;
