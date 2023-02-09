import React from "react";
import { nanoid } from "nanoid";
import { Row, Col } from "@canonical/react-components";

type Props = {
  label: string;
  maxLength?: number;
  name: string;
  register: Function;
  required?: boolean;
  helpText?: string;
  type?: "text" | "email" | "url";
  placeholder?: string;
  getFieldState: Function;
  pattern?: RegExp;
  tourLabel: string;
};

function ListingFormInput({
  label,
  maxLength,
  name,
  register,
  required,
  helpText,
  type,
  placeholder,
  getFieldState,
  pattern,
  tourLabel,
}: Props) {
  const id = nanoid();
  const fieldState = getFieldState ? getFieldState(name) : "";

  return (
    <Row
      className={`p-form__group ${
        fieldState.invalid && "p-form-validation is-error"
      }`}
    >
      <Col size={2} data-tour={tourLabel}>
        <label htmlFor={id} className="p-form__label">
          {label}:
        </label>
      </Col>
      <Col size={8}>
        <div className="p-form__control">
          <input
            data-tour={tourLabel}
            type={type || "text"}
            id={id}
            className="p-form-validation__input"
            maxLength={maxLength || 256}
            placeholder={placeholder}
            {...register(name, { required, pattern: { value: pattern } })}
          />
          {helpText && <p className="p-form-help-text">{helpText}</p>}
        </div>
      </Col>
    </Row>
  );
}

export default ListingFormInput;
