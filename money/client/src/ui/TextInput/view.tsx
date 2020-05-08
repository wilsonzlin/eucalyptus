import React, {ChangeEvent, useCallback} from 'react';
import {ManagedFormComponentProps, UnmanagedFormComponentProps, useManaged} from '../Form/view';
import styles from './style.css';

type CommonTextInputProps = {
  lines?: number;
  name?: string;
  placeholder?: string;
  trim?: boolean;
  autoFocus?: boolean;
};

export const TextInput = ({
  lines = 1,
  name,
  value,
  placeholder,
  trim = false,
  autoFocus = false,
  onChange,
}: CommonTextInputProps & UnmanagedFormComponentProps<string>) => {
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (trim) {
      value.trim();
    }
    onChange(value);
  }, []);

  return lines > 1 ? (
    <textarea
      className={styles.input}
      name={name}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      rows={lines}
    />
  ) : (
    <input
      className={styles.input}
      type="text"
      name={name}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );
};

export const ManagedTextInput = ({
  form,
  name,
  initialValue = '',
  ...textInputProps
}: CommonTextInputProps & ManagedFormComponentProps<string>) => {
  const {value, onChange} = useManaged<string>({form, name, initialValue});
  return (
    <TextInput
      {...textInputProps}
      value={value}
      onChange={onChange}
    />
  );
};
