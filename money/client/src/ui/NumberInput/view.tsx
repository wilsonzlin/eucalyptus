import React, {ChangeEvent, useCallback, useState} from 'react';
import {ManagedFormComponentProps, UnmanagedFormComponentProps, useManaged} from '../Form/view';

type CommonNumberInputProps = {
  name?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  autoFocus?: boolean;
}

export const NumberInput = ({
  name,
  value,
  min,
  max,
  step,
  autoFocus,
  onChange,
}: CommonNumberInputProps & UnmanagedFormComponentProps<number>) => {
  const [uiValue, setUiValue] = useState<string>(value.toString());

  const changeHandler = useCallback(({target}: ChangeEvent<HTMLInputElement>) => {
    setUiValue(target.value);
    const value = target.valueAsNumber;
    if (!Number.isFinite(value)) {
      return;
    }
    onChange(value);
  }, [onChange]);

  const blurHandler = useCallback(() => {
    setUiValue(value.toString());
  }, [value]);

  return (
    <input
      type="number"
      name={name}
      value={uiValue}
      min={min}
      max={max}
      step={step}
      autoFocus={autoFocus}
      onBlur={blurHandler}
      onChange={changeHandler}
    />
  );
};

export const ManagedNumberInput = ({
  form,
  name,
  initialValue = 0,
  ...inputProps
}: CommonNumberInputProps & ManagedFormComponentProps<number>) => {
  const {value, onChange} = useManaged<number>({form, name, initialValue});
  return (
    <NumberInput
      {...inputProps}
      value={value}
      onChange={onChange}
    />
  );
};
