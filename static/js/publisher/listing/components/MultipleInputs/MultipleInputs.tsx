import { useFieldArray } from "react-hook-form";
import { Row, Col, Button, Icon } from "@canonical/react-components";

import UrlInput from "../UrlInput";

type Props = {
  fieldName: string;
  label: string;
  register: Function;
  control: any;
  getFieldState: Function;
};

function MultipleInputs({
  fieldName,
  label,
  register,
  control,
  getFieldState,
}: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const urlFieldNames = ["websites", "donations", "source-code", "issues"];
  const isUrl = urlFieldNames.includes(fieldName);

  return (
    <Row className="p-form__group">
      <Col size={2}>
        <label className="p-form__label">{label}:</label>
      </Col>
      <Col size={8}>
        {fields.map((field, index) => (
          <Row key={field.id}>
            <Col size={5}>
              {isUrl ? (
                <UrlInput
                  fieldName={fieldName}
                  index={index}
                  register={register}
                  getFieldState={getFieldState}
                />
              ) : (
                <div className="p-form__control">
                  <input
                    type="text"
                    {...register(`${fieldName}.${index}.url`, {
                      required: true,
                    })}
                  />
                </div>
              )}
            </Col>
            <Col size={2}>
              <Button
                appearance="base"
                type="button"
                onClick={() => {
                  remove(index);
                }}
              >
                <Icon name="delete">Remove field</Icon>
              </Button>
            </Col>
          </Row>
        ))}

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
  );
}

export default MultipleInputs;
