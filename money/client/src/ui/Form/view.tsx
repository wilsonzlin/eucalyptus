import React, {FormEvent, ReactChild, useCallback, useEffect, useRef, useState} from 'react';

export type FormValues<V> = { [name: string]: V };

export type FormElement<V> = () => [string, V];

export type FormElementsManager<V> = {
  register (e: FormElement<V>): void;
  unregister (e: FormElement<V>): void;
};

export function Form<V, T extends FormValues<V>> ({
  children,
  onSubmit,
}: {
  children: (form: FormElementsManager<V>) => (ReactChild | ReactChild[]);
  onSubmit: (values: T) => void,
}) {
  const elements = useRef(new Set<FormElement<V>>());
  const elementsManager = useRef({
    register: (e: FormElement<V>) => elements.current.add(e),
    unregister: (e: FormElement<V>) => elements.current.delete(e),
  });

  const submitHandler = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(Object.fromEntries<any>([...elements.current].map(elem => elem())));
  }, []);

  return (
    <form onSubmit={submitHandler}>
      {children(elementsManager.current)}
    </form>
  );
}

export type UnmanagedFormComponentProps<V> = {
  value: V;
  onChange: (value: V) => void;
};

export type ManagedFormComponentProps<V> = {
  form: FormElementsManager<V>;
  name: string;
  initialValue?: V;
};

export function useManaged<V> ({
  form,
  name,
  initialValue,
}: {
  form: FormElementsManager<V>;
  name: string;
  initialValue: V;
}) {
  const [value, setValue] = useState<V>(initialValue);

  const element = useCallback(() => [name, value] as [string, V], [name, value]);

  useEffect(() => {
    form.register(element);
    return () => form.unregister(element);
  }, [element]);

  return {
    value,
    onChange: setValue,
  };
}
