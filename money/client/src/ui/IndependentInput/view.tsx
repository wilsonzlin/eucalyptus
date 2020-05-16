import React, {useCallback, useEffect, useRef, useState} from 'react';
import {LatestAsync} from '../../util/LatestAsync';
import {MaybeErrorAlert} from '../Alert/view';

export function IndependentInput<V> ({
  initialValue,
  onChange,
  Input,
}: {
  initialValue: V;
  onChange: (value: V) => Promise<any>;
  Input: (props: { value: V, onChange: (value: V) => void }) => JSX.Element;
}) {
  const [value, setValue] = useState<V>(initialValue);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const latestAsync = useRef<LatestAsync>(new LatestAsync());

  useEffect(() => latestAsync.current.cancelAll());

  const changeHandler = useCallback(async (value: V) => {
    setValue(value);
    setError('');
    try {
      await latestAsync.current.onlyLatest(onChange(value));
      setLoading(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [onChange]);

  return (
    <div>
      <MaybeErrorAlert>{error}</MaybeErrorAlert>
      <Input value={value} onChange={changeHandler}/>
    </div>
  );
}
