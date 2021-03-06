import React, {ChangeEvent, useCallback} from 'react';
import {cls} from '../../util/Classes';
import {ManagedFormComponentProps, UnmanagedFormComponentProps, useManaged} from '../Form/view';
import styles from './style.css';

type CommonTextInputProps = {
  lines?: number;
  columns?: number;
  name?: string;
  placeholder?: string;
  autoFocus?: boolean;
};

export const TextInput = ({
  lines = 1,
  columns,
  name,
  value,
  placeholder,
  autoFocus,
  onChange,
}: CommonTextInputProps & UnmanagedFormComponentProps<string>) => {
  const changeHandler = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    if (lines === 1) {
      value = value.replace(/[\r\n\t\v\f]+/, '');
    }
    onChange(value);
  }, [lines, onChange]);

  return (
    <textarea
      className={cls(styles.input, !columns && styles.expand)}
      cols={columns}
      name={name}
      value={value}
      onChange={changeHandler}
      placeholder={placeholder}
      autoFocus={autoFocus}
      rows={lines}
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
