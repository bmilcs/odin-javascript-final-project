import { useEffect, useState } from 'react';

export type TReturnValues<T> = {
  status: number;
  statusText: string;
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  setUrl: React.Dispatch<React.SetStateAction<string>>;
};

function useFetch<T>(initialUrl: string): TReturnValues<T> {
  const [url, setUrl] = useState<string>(initialUrl);
  const [status, setStatus] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getData = async () => {
    setIsLoading(true);

    // allow cleanup on unmount
    const controller = new AbortController();
    const signal = controller.signal;

    try {
      // make request & save responses
      const response = await fetch(url, { signal });
      setStatus(response.status);
      setStatusText(response.statusText);
      // get data
      const json = await response.json().then((data) => data as T);
      setData(json);
    } catch (err) {
      setError(err as Error);
    }

    setIsLoading(false);

    // cancel fetch request on unmount
    return () => controller.abort();
  };

  // execute fetch on initial render & url change
  useEffect(() => {
    // clear previous results
    setData(null);
    setError(null);
    setStatus(0);
    setStatusText('');

    // prevent empty urls
    if (!url) {
      setIsLoading(false);
      return;
    }

    getData();
  }, [url]);

  return { data, error, status, statusText, isLoading, setUrl };
}

export default useFetch;
