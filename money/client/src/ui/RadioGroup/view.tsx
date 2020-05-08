import React, {ReactChild} from 'react';
import {ManagedFormComponentProps, UnmanagedFormComponentProps, useManaged} from '../Form/view';
import styles from './style.css';

export type CommonRadioGroupProps<V> = {
  name?: string;
  options: { value: V; label: ReactChild; key?: number }[];
};

export function RadioGroup<V> ({
  name,
  options,
  value: selected,
  onChange: onSelect,
}: CommonRadioGroupProps<V> & UnmanagedFormComponentProps<V | undefined>) {
  return (
    <div>
      {options.map(({value, label, key}, i) => (
        <label key={key ?? i}>
          <div className={styles.labelLeft}>
            <input type="radio" name={name} checked={value === selected} onChange={() => onSelect(value)}/>
          </div>
          <div className={styles.labelRight}>
            {label}
          </div>
        </label>
      ))}
    </div>
  );
}

export function ManagedRadioGroup<V> ({
  form,
  name,
  initialValue,
  ...radioGroupProps
}: CommonRadioGroupProps<V> & ManagedFormComponentProps<V>) {
  const {value, onChange} = useManaged<V | undefined>({form, name, initialValue});
  return (
    <RadioGroup
      {...radioGroupProps}
      value={value}
      onChange={onChange}
    />
  );
}
