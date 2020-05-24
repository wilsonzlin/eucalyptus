import React, {useCallback, useEffect, useRef, useState} from 'react';
import {LatestAsync} from '../../util/LatestAsync';
import {MaybeErrorAlert} from '../Alert/view';
import {MaybeLoadingStrip} from '../Loading/view';

export function IndependentInput<V> ({
  initialValue,
  onChange,
  Input,
}: {
  initialValue: V | (() => Promise<V>);
  onChange: (value: V) => Promise<any>;
  Input: (props: { value: V, onChange: (value: V) => void }) => JSX.Element;
}) {
  const usingFetcher = typeof initialValue == 'function';
  const [value, setValue] = useState<V>();
  const fetched = useRef<boolean>(!usingFetcher);
  const [loading, setLoading] = useState<boolean>(usingFetcher);
  const [error, setError] = useState<string>('');

  const latestAsync = useRef<LatestAsync>(new LatestAsync());
  useEffect(() => {
    if (!usingFetcher) {
      return;
    }
    // `loading` should already be true.
    latestAsync.current.onlyLatest((initialValue as (() => Promise<V>))())
      .then(value => setValue(value))
      .catch(err => setError(err.message))
      .then(() => setLoading(false));
    fetched.current = true;
  }, []);
  useEffect(() => () => latestAsync.current.cancelAll(), []);

  const changeHandler = useCallback(async (value: V) => {
    setValue(value);
    setLoading(true);
    setError('');
    try {
      await latestAsync.current.onlyLatest(onChange(value));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [onChange]);

  return (
    <div>
      <MaybeErrorAlert>{error}</MaybeErrorAlert>
      <MaybeLoadingStrip loading={loading}/>
      {fetched.current && (
        <Input value={value as V} onChange={changeHandler}/>
      )}
    </div>
  );
}
