import { useEffect, useState } from 'react';

export const useLocalStorage = <T>(key: string, initialValue: T): [T, (value: T) => void] => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

export const useInfiniteScroll = (callback: () => void, threshold: number = 0.8) => {
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight * threshold
      ) {
        callback();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, threshold]);
};