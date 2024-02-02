import React from "react";
import { useFieldArray } from "react-hook-form";
import { Row, Col, Button, Icon } from "@canonical/react-components";

type Props = {
  fieldName: string;
  label: string;
  register: Function;
  control: any;
};

function MultipleInputs({ fieldName, label, register, control }: Props) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  let type: string;

  const urlFieldNames = ["websites", "donations", "source-code", "issues"];

  if (urlFieldNames.includes(fieldName)) {
    type = "url";
  } else {
    type = "text";
  }

  return (
    <Row className="p-form__group">
      <Col size={2}>
        <label className="p-form__label">{label}:</label>
      </Col>
      <Col size={8}>
        {fields.map((field, index) => (
          <Row key={field.id}>
            <Col size={5}>
              <div className="p-form__control">
                <input
                  type={type}
                  {...register(`${fieldName}.${index}.url`, {
                    required: true,
                  })}
                />
              </div>
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
