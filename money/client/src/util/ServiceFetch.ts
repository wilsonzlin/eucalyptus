import {useEffect, useRef, useState} from 'react';
import {ServiceError} from '../service/Service';
import {LatestAsync} from './LatestAsync';

export const useServiceFetch = <D> ({
  fetcher,
  defaultValue,
  dependencies,
  fetchInitially = true,
}: {
  fetcher: () => Promise<D>,
  defaultValue: D,
  dependencies: any[],
  fetchInitially?: boolean;
}): {
  refreshed: Date | undefined;
  refresh: () => void;
  loading: boolean;
  data: D;
  error: string;
} => {
  const isInitial = useRef<boolean>(true);
  const [refreshed, setRefreshed] = useState<Date | undefined>(fetchInitially ? new Date() : undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<D>(defaultValue);
  const [error, setError] = useState<string>('');

  const latest = useRef<LatestAsync>(new LatestAsync());
  useEffect(() => {
    if (!isInitial.current || fetchInitially) {
      latest.current
        .onlyLatest(fetcher())
        .then(data => {
          setData(data);
          setError('');
        }, error => {
          if (error instanceof ServiceError) {
            setError(error.message);
          } else {
            console.error(error);
            setError(`Something went wrong.`);
          }
        })
        .then(() => setLoading(false));
    }
    isInitial.current = false;
    return () => latest.current.cancelAll();
  }, [refreshed, ...dependencies]);

  return {
    refreshed,
    refresh: () => {
      isInitial.current = false;
      setRefreshed(new Date());
    },
    loading,
    data,
    error,
  };
};
