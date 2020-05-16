import React, {ReactNode, useCallback, useEffect, useState} from 'react';
import {PointerDismissible} from '../Dismissible/view';

export function ModifiableDisplayValue<V> ({
  value,
  onChange,
  Input,
  children,
}: {
  value: V;
  onChange: (value: V) => void;
  Input: (props: { value: V, onChange: (value: V) => void, autoFocus: boolean }) => JSX.Element;
  children: ReactNode;
}) {
  const [editing, setEditing] = useState<boolean>(false);

  const clickHandler = useCallback(() => setEditing(true), []);

  const dismissHandler = useCallback(() => setEditing(false), []);

  const escHandler = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      dismissHandler();
    }
  }, [dismissHandler]);

  useEffect(() => {
    document.addEventListener('keydown', escHandler);
    return () => document.removeEventListener('keydown', escHandler);
  }, [escHandler]);

  return (
    <PointerDismissible<HTMLDivElement> onDismiss={dismissHandler}>
      {ref => (
        <div ref={ref}>
          {editing ? (
            <Input value={value} onChange={onChange} autoFocus={true}/>
          ) : (
            <div onClick={clickHandler}>{children}</div>
          )}
        </div>
      )}
    </PointerDismissible>
  );
}
