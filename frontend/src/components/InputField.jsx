import React from 'react';
import './InputField.css';

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  large = false,
  selectAllOnFocus = true,
  ...props
}) => {
  return (
    <div className={`input-field ${large ? 'large' : ''}`}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        onFocus={(e) => {
          if (selectAllOnFocus) {
            e.target.select();
          }
          if (props.onFocus) props.onFocus(e);
        }}
        {...props}
      />
      <label>{label}</label>
    </div>
  );
};

export default InputField;
