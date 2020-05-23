import React, {createRef, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState} from 'react';
import {assertExists, assertInstanceOf} from '../../util/Assert';
import {ManagedFormComponentProps, UnmanagedFormComponentProps, useManaged} from '../Form/view';
import {Flex} from '../Layout/view';
import {InvisibleInput} from './InvisibleInput/view';
import styles from './style.css';

type IDInputValue<M extends boolean> = M extends true ? number[] : (number | undefined);

export type IDInputOption = { id: number; label: string; };

export class IDStore {
  private readonly labels = new Proxy<{ [id: number]: string }>({}, {
    get: (labels, id: number) => {
      if (labels[id] == undefined) {
        this.labelFetcher(id).then(label => this.addLabels([{id, label}]));
        return '\u{2026}';
      }
      return labels[id];
    },
    set: (labels, id, value) => {
      labels[id] = value;
      return true;
    },
  });
  private readonly trackers = new Set<Dispatch<SetStateAction<number>>>();

  constructor (
    private readonly suggester: (query: string) => Promise<IDInputOption[]>,
    private readonly labelFetcher: (id: number) => Promise<string>,
  ) {
  }

  use () {
    const [_, setTracker] = useState<number>(0);
    useEffect(() => {
      this.trackers.add(setTracker);
      return () => void this.trackers.delete(setTracker);
    }, []);
    return this.labels;
  }

  addLabels (toAdd: IDInputOption[]): void {
    for (const {id, label} of toAdd) {
      this.labels[id] = label;
    }
    for (const tracker of this.trackers) {
      tracker(x => x + 1);
    }
  }

  readonly suggest = async (query: string): Promise<IDInputOption[]> => {
    const res = await this.suggester(query);
    this.addLabels(res);
    return res;
  };
}

type CommonIDInputProps<M extends boolean> = {
  idStore: IDStore;
  multiple: M;
};

const ORDER_0 = {order: 0};
const ORDER_2 = {order: 2};

export function IDInput<M extends boolean> ({
  idStore,
  multiple,
  value,
  onChange,
}: CommonIDInputProps<M> & UnmanagedFormComponentProps<IDInputValue<M>>) {
  const [inputPosition, setInputPosition] = useState<number>(-1);

  const values = useMemo<number[]>(() => Array<number>().concat(value ?? []), [value]);

  const $container = createRef<HTMLDivElement>();
  const $input = createRef<HTMLInputElement>();

  const labels = idStore.use();

  const moveInputPosition = useCallback((dir: -1 | 1) => {
    setInputPosition(Math.max(0, Math.min(values.length, inputPosition + dir)));
  }, [values, inputPosition]);

  const previousInputPosition = useCallback(() => moveInputPosition(-1), [moveInputPosition]);

  const nextInputPosition = useCallback(() => moveInputPosition(1), [moveInputPosition]);

  const callOnChange = useCallback((newValue: number[]) => {
    const seen = new Set<number>();
    let res: any = newValue.filter(id => {
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
    if (!multiple) {
      res = res[0];
    }
    onChange(res);
  }, [onChange]);

  const deleteHandler = useCallback((backwards: boolean) => {
    const id = values[inputPosition - (backwards ? 1 : 0)];
    if (id === undefined) {
      return;
    }
    callOnChange(values.filter(v => v !== id));
    if (backwards) {
      previousInputPosition();
    }
  }, [values, inputPosition, callOnChange, previousInputPosition]);

  const deletePreviousHandler = useCallback(() => deleteHandler(true), [deleteHandler]);

  const deleteNextHandler = useCallback(() => deleteHandler(false), [deleteHandler]);

  const addHandler = useCallback((id: number) => {
    callOnChange(!multiple ? [id] : [...values.slice(0, inputPosition), id, ...values.slice(inputPosition)]);
    setInputPosition(inputPosition + 1);
  }, [callOnChange, values, inputPosition]);

  const containerFocusHandler = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (e.target === $container.current) {
      setInputPosition(values.length);
      $input.current?.focus();
    }
  }, [$container, values, $input]);

  return (
    <div
      ref={$container}
      className={styles.idInput}
      tabIndex={0}
      onFocus={containerFocusHandler}
    >
      <Flex overflow="auto" space="end" align="stretch">
        {values.map((id, pos) => (
          <div
            key={id}
            className={styles.value}
            onClick={e => {
              const $value = assertInstanceOf(e.target, HTMLDivElement);
              setInputPosition(pos + Math.round((e.clientX - $value.getBoundingClientRect().left) / $value.clientWidth));
            }}
            style={pos < inputPosition ? ORDER_0 : ORDER_2}
          >
            {assertExists(labels[id])}
          </div>
        ))}
        <div className={styles.valueInput}>
          <InvisibleInput
            ref={$input}
            suggester={idStore.suggest}
            onEmptyLeftArrow={previousInputPosition}
            onEmptyRightArrow={nextInputPosition}
            onEmptyBackspace={deletePreviousHandler}
            onEmptyDelete={deleteNextHandler}
            onConfirm={addHandler}
          />
        </div>
      </Flex>
    </div>
  );
}

export function ManagedIDInput<M extends boolean> ({
  form,
  name,
  initialValue,
  ...inputProps
}: CommonIDInputProps<M> & ManagedFormComponentProps<IDInputValue<M>>) {
  const {value, onChange} = useManaged<IDInputValue<M>>({form, name, initialValue: initialValue ?? (inputProps.multiple ? [] : undefined) as any});
  return (
    <IDInput
      {...inputProps}
      value={value}
      onChange={onChange}
    />
  );
}
