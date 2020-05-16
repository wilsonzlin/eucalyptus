import React, {ChangeEvent, createRef, useCallback} from 'react';
import {SecondaryButton} from '../Button/view';
import {ManagedFormComponentProps, UnmanagedFormComponentProps, useManaged} from '../Form/view';

type FileInputValue<M extends boolean> = (M extends true ? File[] : File) | undefined;

type CommonFileInputProps<M extends boolean> = {
  name?: string;
  multiple: M;
}

const formatSize = (size: number): string => {
  for (const suffix of ['K', 'M', 'G', 'T', 'P']) {
    size /= 1024;
    if (size < 1000) {
      return `${size.toFixed(2)} ${suffix}`;
    }
  }
  return `${size.toFixed(2)} EB`;
};

export function FileInput<M extends boolean> ({
  name,
  multiple,
  value,
  onChange,
}: CommonFileInputProps<M> & UnmanagedFormComponentProps<FileInputValue<M>>) {
  const $input = createRef<HTMLInputElement>();

  const changeHandler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    let value: any = [...e.target.files!];
    if (!value.length) {
      value = undefined;
    } else if (!multiple) {
      value = value[0];
    }
    onChange(value);
  }, []);

  const clickHandler = useCallback(() => $input.current?.click(), []);

  return (
    <div>
      <input
        ref={$input}
        hidden
        name={name}
        type="file"
        onChange={changeHandler}
      />
      <SecondaryButton
        onClick={clickHandler}
      >Select file{multiple ? 's' : ''}</SecondaryButton>
      <ul>
        {Array<File>().concat(value ?? []).map((f, i) => (
          <li key={i}>
            <div>{f.name}</div>
            <div>{formatSize(f.size)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ManagedFileInput<M extends boolean> ({
  form,
  name,
  initialValue,
  ...fileInputProps
}: CommonFileInputProps<M> & ManagedFormComponentProps<FileInputValue<M>>) {
  const {value, onChange} = useManaged<FileInputValue<M>>({form, name, initialValue});
  return (
    <FileInput
      {...fileInputProps}
      value={value}
      onChange={onChange}
    />
  );
}
