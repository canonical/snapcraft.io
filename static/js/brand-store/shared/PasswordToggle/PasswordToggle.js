import React, { useState } from "react";
import PropTypes from "prop-types";

function PasswordToggle({ id, value, label, readOnly }) {
  const [fieldType, setFieldType] = useState("password");
  const isPassword = fieldType === "password";

  return (
    <div className="p-form__group">
      <div className="p-form-password-toggle">
        <label htmlFor={id}>{label}</label>
        <button
          className="p-button--base u-no-margin--bottom has-icon"
          aria-live="polite"
          aria-controls="password"
          type="button"
          onClick={() => {
            if (isPassword) {
              setFieldType("text");
            } else {
              setFieldType("password");
            }
          }}
        >
          <span className="p-form-password-toggle__label">
            {isPassword ? "Show" : "Hide"}
          </span>
          <i className={isPassword ? "p-icon--show" : "p-icon--hide"}></i>
        </button>
      </div>
      <input
        type={fieldType}
        name={id}
        id={id}
        defaultValue={value}
        readOnly={readOnly}
      />
    </div>
  );
}

PasswordToggle.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  readOnly: PropTypes.bool,
};

export default PasswordToggle;
