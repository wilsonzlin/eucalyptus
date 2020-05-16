import React, {ChangeEvent, createRef, forwardRef, useCallback, useState} from 'react';
import {assertInstanceOf} from '../../../util/Assert';
import {measureText} from '../../../util/MeasureText';
import {useServiceFetch} from '../../../util/ServiceFetch';
import {Floating} from '../../Floating/view';
import {IDInputOption} from '../view';
import styles from './style.css';

export type InvisibleInputProps = {
  suggester: (query: string) => Promise<IDInputOption[]>;
  onEmptyBackspace (): void;
  onEmptyDelete (): void;
  onEmptyLeftArrow (): void;
  onEmptyRightArrow (): void;
  onConfirm (id: number): void;
};

export const InvisibleInput = forwardRef<HTMLInputElement, InvisibleInputProps>(({
  suggester,
  onEmptyBackspace,
  onEmptyDelete,
  onEmptyLeftArrow,
  onEmptyRightArrow,
  onConfirm,
}, $inputRef) => {
  const [value, setValue] = useState<string>('');
  const [width, setWidth] = useState<number>(0);
  const [suggestionsOpen, setSuggestionsOpen] = useState<boolean>(false);

  const $suggestions = createRef<HTMLDivElement>();

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

  const closeSuggestions = useCallback(() => setSuggestionsOpen(false), []);

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

  const blurHandler = useCallback(() => {
    reset();
  }, []);

  const {data: suggestions} = useServiceFetch<IDInputOption[]>({
    fetcher: async () => !value ? [] : suggester(value),
    initial: [],
    dependencies: [value],
  });

  return (
    <div className={styles.container}>
      <input
        ref={$inputRef}
        tabIndex={-1}
        className={styles.input}
        onKeyDown={keyDownHandler}
        onChange={changeHandler}
        onBlur={blurHandler}
        value={value}
        style={{width: `${width}px`}}
      />
      <Floating
        open={suggestionsOpen}
        onDismiss={closeSuggestions}
        top={1}
        left={0}
      >
        <div className={styles.suggestions} ref={$suggestions}>
          {suggestions.map(s => (
            <button
              key={s.id}
              className={styles.suggestion}
              onMouseDown={e => {
                // Do not let input lose focus.
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
});
