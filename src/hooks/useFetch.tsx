import { useEffect, useState } from "react";

export type TApiResponse = {
  status: Number;
  statusText: String;
  data: any;
  error: any;
  isLoading: Boolean;
};

function useFetch(url: string): TApiResponse {
  const [status, setStatus] = useState<Number>(0);
  const [statusText, setStatusText] = useState<String>("");
  const [data, setData] = useState<any>();
  const [error, setError] = useState<any>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getData = async () => {
    setIsLoading(true);

    // prevent empty urls
    if (!url) {
      setError("Missing URL");
      setIsLoading(false);
      return;
    }

    // allow cleanup on unmount
    const controller = new AbortController();
    const signal = controller.signal;

    try {
      // make request & save responses
      const response = await fetch(url, { signal });
      setStatus(response.status);
      setStatusText(response.statusText);
      // get data
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err);
    }

    setIsLoading(false);

    // cancel fetch request on unmount
    return () => controller.abort();
  };

  // execute fetch on initial render & url change
  useEffect(() => {
    getData();
  }, []);

  return { data, error, status, statusText, isLoading };
}

export default useFetch;
