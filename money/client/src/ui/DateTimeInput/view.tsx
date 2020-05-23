import moment, {Moment} from 'moment';
import React, {ChangeEvent, useCallback, useState} from 'react';
import {ManagedFormComponentProps, UnmanagedFormComponentProps, useManaged} from '../Form/view';

export type CommonDateTimeInputProps = {
  name?: string;
  placeholder?: string;
  autoFocus?: boolean;
};

const MOMENT_FORMAT = 'YYYY-MM-DD HH:mm';

export const DateTimeInput = ({
  name,
  value,
  placeholder,
  autoFocus,
  onChange,
}: CommonDateTimeInputProps & UnmanagedFormComponentProps<Moment | undefined>) => {
  const [uiValue, setUiValue] = useState<string>(value?.format(MOMENT_FORMAT) ?? '');

  const changeHandler = useCallback(({target}: ChangeEvent<HTMLInputElement>) => {
    const raw = target.value;
    setUiValue(raw);
    if (!raw.trim()) {
      onChange(undefined);
      return;
    }
    const value = moment(raw, MOMENT_FORMAT);
    if (!value.isValid()) {
      return;
    }
    onChange(value);
  }, [onChange]);

  const blurHandler = useCallback(() => {
    setUiValue(value?.format(MOMENT_FORMAT) ?? '');
  }, [value]);

  return (
    <input
      name={name}
      type="text"
      value={uiValue}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onBlur={blurHandler}
      onChange={changeHandler}
    />
  );
};

export const ManagedDateTimeInput = ({
  form,
  name,
  initialValue = undefined,
  ...inputProps
}: CommonDateTimeInputProps & ManagedFormComponentProps<Moment | undefined>) => {
  const {value, onChange} = useManaged<Moment | undefined>({form, name, initialValue});
  return (
    <DateTimeInput
      {...inputProps}
      value={value}
      onChange={onChange}
    />
  );
};
