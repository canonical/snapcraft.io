import { useState, useEffect } from "react";

function useLocalStorage<T = unknown>(
  key: string,
  initialValue?: T | (() => T),
): [T, (value: T | ((prevValue: T) => T)) => void] {
  // use a function to initialize the state to ensure init only runs on first render
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = window.localStorage.getItem(key);
    return item
      ? JSON.parse(item)
      : initialValue instanceof Function
        ? initialValue()
        : initialValue;
  });

  // when state changes update local storage
  useEffect(() => {
    setTimeout(() => {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    }, 0); // delay the write to let React do its job first
  }, [key, storedValue]);

  // same API as useState so we have to accept a function as argument
  const setValue = (value: T | ((prevValue: T) => T)): void => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
