import React, {ChangeEvent, useCallback} from 'react';
import {assertIndexOf, assertState} from '../../util/Assert';
import {ManagedFormComponentProps, UnmanagedFormComponentProps, useManaged} from '../Form/view';

type CommonSelectProps<V> = {
  name?: string;
  disabled?: boolean;
  options: { label: string; value: V }[];
  autoFocus?: boolean;
};

export function Select<V> ({
  name,
  disabled,
  options,
  value,
  autoFocus,
  onChange,
}: CommonSelectProps<V> & UnmanagedFormComponentProps<V>) {
  assertState(options.length > 0);

  const changeHandler = useCallback(({target}: ChangeEvent<HTMLSelectElement>) => {
    onChange(options[target.value].value);
  }, [options]);

  return (
    <select
      name={name}
      disabled={disabled}
      value={assertIndexOf(options.findIndex(o => o.value === value))}
      onChange={changeHandler}
      autoFocus={autoFocus}
    >
      {options.map((o, i) => (
        <option key={i} value={i}>{o.label}</option>
      ))}
    </select>
  );
}

export function ManagedSelect<V> ({
  form,
  name,
  initialValue,
  ...selectProps
}: CommonSelectProps<V> & ManagedFormComponentProps<V>) {
  assertState(selectProps.options.length > 0);
  const {value, onChange} = useManaged<V>({form, name, initialValue: initialValue ?? selectProps.options[0].value});
  return (
    <Select
      {...selectProps}
      value={value}
      onChange={onChange}
    />
  );
}
