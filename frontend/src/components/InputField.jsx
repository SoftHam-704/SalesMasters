import React, { useRef } from 'react';
import './InputField.css';

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  large = false,
  selectAllOnFocus = true,
  className,
  ...props
}) => {
  const inputRef = useRef(null);

  const handleFocus = (e) => {
    if (selectAllOnFocus) {
      e.target.select();
    }
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  return (
    <div className={`input-field ${large ? 'large' : ''} ${className || ''}`}>
      {label && <label>{label}</label>}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};

export default InputField;
