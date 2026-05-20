import { useCallback, useState } from 'react';
import type { ChecklistItem } from '../mockData';

export function useToggleChecklist(initial: ChecklistItem[]) {
  const [items, setItems] = useState(initial);

  const toggle = useCallback((id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }, []);

  return { items, toggle };
}
