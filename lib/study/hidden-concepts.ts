import { useEffect, useState } from 'react';

const key = (materialId: string) => `masterme:hidden-concepts:${materialId}`;
const changeEvent = 'masterme:hidden-concepts-changed';

export function getHiddenConceptIds(materialId: string): string[] {
  if (!materialId || typeof window === 'undefined') return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key(materialId)) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
}

export function setConceptHidden(materialId: string, conceptId: string, hidden: boolean) {
  const current = getHiddenConceptIds(materialId);
  const next = hidden ? [...new Set([...current, conceptId])] : current.filter((id) => id !== conceptId);
  window.localStorage.setItem(key(materialId), JSON.stringify(next));
  window.dispatchEvent(new Event(changeEvent));
}

export function useHiddenConceptIds(materialId: string) {
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  useEffect(() => {
    const refresh = () => setHiddenIds(getHiddenConceptIds(materialId));
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener(changeEvent, refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener(changeEvent, refresh); };
  }, [materialId]);
  return hiddenIds;
}
