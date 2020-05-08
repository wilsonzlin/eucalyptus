import {useEffect, useState} from 'react';
import {LatestAsync} from './LatestAsync';

export const useServiceFetch = <D> ({
  fetcher,
  initial,
  dependencies,
}: {
  fetcher: () => Promise<D>,
  initial: D,
  dependencies: any[],
}): {
  refreshed: Date;
  refresh: () => void;
  loading: boolean;
  data: D;
  error: string;
} => {
  const [refreshed, setRefreshed] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<D>(initial);
  const [error, setError] = useState<string>('');

  const latest = new LatestAsync();
  useEffect(() => {
    latest
      .onlyLatest(fetcher())
      .then(data => {
        setData(data);
        setError('');
      }, setError)
      .then(() => setLoading(false));
  }, [refreshed, ...dependencies]);

  return {
    refreshed,
    refresh: () => setRefreshed(new Date()),
    loading,
    data,
    error,
  };
};
