import { RefObject, useEffect } from 'react';

type Event = MouseEvent | TouchEvent;

// invoke the callback function when the user clicks outside
// of the ref element
const useOnClickOutside = <T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  callback: (event: Event) => void,
) => {
  useEffect(() => {
    const listener = (event: Event) => {
      const el = ref?.current;
      if (!el || el.contains((event?.target as Node) || null)) {
        return;
      }

      callback(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };

    // reload if ref or callback changes
  }, [ref, callback]);
};

export default useOnClickOutside;
