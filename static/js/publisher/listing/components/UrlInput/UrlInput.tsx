import React from "react";

type Props = {
  fieldName: string;
  index: number;
  register: Function;
  getFieldState: Function;
};

function UrlInput({ fieldName, index, register, getFieldState }: Props) {
  const name = `${fieldName}.${index}.url`;
  const fieldState = getFieldState(name);
  const isInvalid = fieldState.invalid;

  return (
    <div
      className={`p-form__group ${isInvalid && "p-form-validation is-error"}`}
    >
      <input
        type="url"
        id={name}
        className="p-form-validation__input"
        {...register(name, {
          required: false,
          pattern: { value: /^https?:\/\//gi },
        })}
      />
      {fieldState.invalid && (
        <p className="p-form-validation__message">Please enter a valid URL</p>
      )}
    </div>
  );
}

export default UrlInput;
