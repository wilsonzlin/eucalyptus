import React, {ChangeEvent, createRef, useCallback, useEffect, useState} from 'react';
import {assertInstanceOf} from '../../../util/Assert';
import {measureText} from '../../../util/MeasureText';
import {useServiceFetch} from '../../../util/ServiceFetch';
import {Floating} from '../../Flyout/view';
import {IDInputOption} from '../view';
import styles from './style.css';

export type InvisibleInputProps = {
  focused: boolean;
  suggester: (query: string) => Promise<IDInputOption[]>;
  onInputFocus? (): void;
  onInputBlur? (): void;
  onEmptyBackspace (): void;
  onEmptyDelete (): void;
  onEmptyLeftArrow (): void;
  onEmptyRightArrow (): void;
  onConfirm (id: number): void;
};

export const InvisibleInput = ({
  focused,
  suggester,
  onInputFocus,
  onInputBlur,
  onEmptyBackspace,
  onEmptyDelete,
  onEmptyLeftArrow,
  onEmptyRightArrow,
  onConfirm,
}: InvisibleInputProps) => {
  const [value, setValue] = useState<string>('');
  const [width, setWidth] = useState<number>(0);
  const [suggestionsOpen, setSuggestionsOpen] = useState<boolean>(false);

  const $input = createRef<HTMLInputElement>();
  const $suggestions = createRef<HTMLDivElement>();

  useEffect(() => {
    // TODO Don't do this on every render in case we rerender something else in the background and IDInput is not actually focused.
    if (focused) {
      $input.current?.focus();
    }
  });

  const reset = useCallback(() => {
    setValue('');
    setWidth(0);
  }, []);

  const changeHandler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(value);
    setWidth(measureText(value));
    setSuggestionsOpen(true);
  }, []);

  const keyDownHandler = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const $input = assertInstanceOf(e.target, HTMLInputElement);
    if (!$input.value) {
      switch (e.key) {
      case 'Backspace':
        onEmptyBackspace();
        break;
      case 'Delete':
        onEmptyDelete();
        break;
      case 'ArrowLeft':
        onEmptyLeftArrow();
        break;
      case 'ArrowRight':
        onEmptyRightArrow();
        break;
      }
    }
  }, [onEmptyBackspace, onEmptyDelete, onEmptyLeftArrow, onEmptyRightArrow]);

  const focusHandler = useCallback(() => {
    onInputFocus?.();
  }, [onInputFocus]);

  const blurHandler = useCallback(() => {
    reset();
    onInputBlur?.();
  }, [onInputBlur]);

  const {data: suggestions} = useServiceFetch<IDInputOption[]>({
    fetcher: async () => !value ? [] : suggester(value),
    initial: [],
    dependencies: [value],
  });

  return (
    <div className={styles.container}>
      <input
        ref={$input}
        className={styles.input}
        onKeyDown={keyDownHandler}
        onChange={changeHandler}
        onFocus={focusHandler}
        onBlur={blurHandler}
        value={value}
        style={{width: `${width}px`}}
      />
      <Floating
        open={suggestionsOpen}
        onDismiss={() => setSuggestionsOpen(false)}
        top={1}
        left={0}
      >
        <div className={styles.suggestions} ref={$suggestions}>
          {suggestions.map(s => (
            <button
              key={s.id}
              className={styles.suggestion}
              onMouseDown={e => {
                // When onConfirm is called, the parent IDInput will update the focus, but then this mouseDown will focus this button and undo the focus, so prevent the default behaviour.
                e.preventDefault();
                // Listen to mouseDown to run before input's blur, which would otherwise reset and prevent this from clicking.
                onConfirm(s.id);
                reset();
              }}
            >{s.label}</button>
          ))}
        </div>
      </Floating>
    </div>
  );
};
