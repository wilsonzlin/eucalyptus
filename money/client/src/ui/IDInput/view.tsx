import React, {createRef, Dispatch, SetStateAction, useCallback, useEffect, useRef, useState} from 'react';
import {assertExists, assertInstanceOf} from '../../util/Assert';
import {ManagedFormComponentProps, UnmanagedFormComponentProps, useManaged} from '../Form/view';
import {Flex} from '../Layout/view';
import {InvisibleInput} from './InvisibleInput/view';
import styles from './style.css';

type IDInputValue<M extends boolean> = M extends true ? number[] : (number | undefined);

export type IDInputOption = { id: number; label: string; };

export interface IDStore {
  use (): { [id: number]: string };

  addLabels (labels: IDInputOption[]): void;

  suggest (query: string): Promise<IDInputOption[]>;
}

export const createIDStore = (suggester: (query: string) => Promise<IDInputOption[]>): IDStore => {
  const labels: { [id: number]: string } = {};
  const trackers = new Set<Dispatch<SetStateAction<number>>>();
  return {
    use () {
      const [_, setTracker] = useState<number>(0);
      useEffect(() => {
        trackers.add(setTracker);
        return () => void trackers.delete(setTracker);
      }, []);
      return labels;
    },
    addLabels (toAdd) {
      for (const {id, label} of toAdd) {
        labels[id] = label;
      }
      for (const tracker of trackers) {
        tracker(x => x + 1);
      }
    },
    async suggest (query) {
      const res = await suggester(query);
      this.addLabels(res);
      return res;
    },
  };
};

type CommonIDInputProps<M extends boolean> = {
  idStore: IDStore;
  multiple: M;
};

// TODO Clean up and improve reliability and performance of IDInput and InvisibleInput.
export function IDInput<M extends boolean> ({
  idStore,
  multiple,
  value,
  onChange,
}: CommonIDInputProps<M> & UnmanagedFormComponentProps<IDInputValue<M>>) {
  const [_, setTick] = useState<number>(0);
  const focus = useRef<number>(-2);

  const values = Array<number>().concat(value ?? []);

  const $container = createRef<HTMLDivElement>();

  const labels = idStore.use();

  const setFocus = (val: number) => {
    focus.current = val;
    setTick(t => t + 1);
  };

  const moveFocus = (dir: -1 | 1) => {
    setFocus(Math.max(0, Math.min(values.length, (focus.current === -1 ? values.length : focus.current) + dir)));
  };

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

  const deleteHandler = (valueIdx: number, backwards: boolean) => {
    const id = values[valueIdx];
    if (id === undefined) {
      return;
    }
    callOnChange(values.filter(v => v !== id));
    if (backwards) {
      moveFocus(-1);
    }
  };

  // TODO Focus is lost on change.
  const addHandler = (pos: number, id: number) => {
    if (focus.current === values.length || focus.current === -1) {
      setFocus(-1);
    } else {
      moveFocus(1);
    }
    callOnChange(!multiple ? [id] : [...values.slice(0, pos), id, ...values.slice(pos)]);
  };

  const valueClickHandler = (valIdx: number, e: React.MouseEvent<HTMLDivElement>) => {
    const $value = assertInstanceOf(e.target, HTMLDivElement);
    setFocus(valIdx + Math.round((e.clientX - $value.getBoundingClientRect().left) / $value.clientWidth));
  };

  return (
    <div className={styles.idInput} ref={$container}>
      <Flex overflow="auto" space="end" align="stretch">
        <div className={styles.valueInput}>
          <InvisibleInput
            focused={focus.current === 0 || (focus.current === -1 && !values.length)}
            suggester={query => idStore.suggest(query)}
            onInputFocus={() => setFocus(0)}
            onEmptyBackspace={() => void 0}
            onEmptyDelete={() => deleteHandler(0, false)}
            onEmptyLeftArrow={() => void 0}
            onEmptyRightArrow={() => moveFocus(1)}
            onConfirm={id => addHandler(0, id)}
          />
        </div>
        {values.map((id, pos) => (
          <React.Fragment key={id}>
            <div className={styles.value} onClick={e => valueClickHandler(pos, e)}>
              {assertExists(labels[id])}
            </div>
            <div className={styles.valueInput}>
              <InvisibleInput
                focused={focus.current === pos + 1 || (focus.current === -1 && pos === values.length - 1)}
                suggester={query => idStore.suggest(query)}
                onInputFocus={() => setFocus(pos + 1)}
                onEmptyLeftArrow={() => moveFocus(-1)}
                onEmptyRightArrow={() => moveFocus(1)}
                onEmptyBackspace={() => deleteHandler(pos, true)}
                onEmptyDelete={() => deleteHandler(pos + 1, false)}
                onConfirm={id => addHandler(pos + 1, id)}
              />
            </div>
          </React.Fragment>
        ))}
        <div className={styles.endClickTarget} onClick={() => setFocus(values.length)}/>
      </Flex>
    </div>
  );
}

export function ManagedSelectionInput<M extends boolean> ({
  form,
  name,
  initialValue,
  ...inputProps
}: CommonIDInputProps<M> & ManagedFormComponentProps<IDInputValue<M>>) {
  const {value, onChange} = useManaged<IDInputValue<M>>({form, name, initialValue: (inputProps.multiple ? [] : undefined) as any});
  return (
    <IDInput
      {...inputProps}
      value={value}
      onChange={onChange}
    />
  );
}
