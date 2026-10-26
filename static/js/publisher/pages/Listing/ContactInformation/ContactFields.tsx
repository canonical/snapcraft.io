import {
  Control,
  FieldValues,
  useFieldArray,
  UseFormGetValues,
  UseFormRegister,
} from "react-hook-form";
import { Row, Col } from "@canonical/react-components";
import { Button, Icon } from "@canonical/react-ds-global";

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
}: Props): React.JSX.Element {
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
            <p>
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  append({ url: "" });
                }}
              >
                +&nbsp;Add link
              </Button>
            </p>
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
                id={fieldName}
                type="url"
                {...register(`${fieldName}.${index}.url`)}
                defaultValue={getValues(`${fieldName}.${index}.url`)}
              />
            </div>
          </Col>
          <Col size={2}>
            <Button
              type="button"
              importance="tertiary"
              onClick={() => {
                remove(index);
              }}
              aria-label="Remove this link"
            >
              <Icon icon="delete" />
            </Button>
          </Col>
        </Row>
      ))}

      {fields.length > 0 && (
        <Row>
          <Col size={5} emptyLarge={3}>
            <p>
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  append({ url: "" });
                }}
              >
                +&nbsp;Add link
              </Button>
            </p>
          </Col>
        </Row>
      )}
    </>
  );
}

export default ContactFields;
