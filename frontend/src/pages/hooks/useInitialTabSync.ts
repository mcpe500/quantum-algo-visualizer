import { useEffect } from 'react';

export function useInitialTabSync<T extends string>(
  initialTab: T,
  setActiveTab: (tab: T) => void,
) {
  useEffect(() => {
    queueMicrotask(() => setActiveTab(initialTab));
  }, [initialTab, setActiveTab]);
}
