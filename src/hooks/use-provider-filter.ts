"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "watchily:provider-filter";
const CHANGE_EVENT = "watchily:provider-filter-change";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) onStoreChange();
  };
  const onCustom = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onCustom);
  };
}

function getSnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "__unset__";
  } catch {
    return "__unset__";
  }
}

function getServerSnapshot(): string {
  return "__unset__";
}

function parseStored(raw: string): string[] | null {
  if (raw === "__unset__") return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return null;
  }
}

function writeStoredIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore quota / private mode
  }
}

function intersect(a: string[], b: Set<string>): string[] {
  return a.filter((id) => b.has(id));
}

/**
 * Subset filter over the user's subscribed providers.
 * Persists in localStorage for web móvil / PWA across Popular, listas y Ver todo.
 */
export function useProviderFilter(userProviderIds: string[]) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const stored = parseStored(raw);

  const activeIds = useMemo(() => {
    const availableSet = new Set(userProviderIds);
    if (stored === null) return [...userProviderIds];
    const next = intersect(stored, availableSet);
    if (stored.length > 0 && next.length === 0) return [...userProviderIds];
    return next;
  }, [stored, userProviderIds]);

  const toggle = useCallback(
    (id: string) => {
      if (!userProviderIds.includes(id)) return;
      const has = activeIds.includes(id);
      const next = has ? activeIds.filter((x) => x !== id) : [...activeIds, id];
      writeStoredIds(next);
    },
    [userProviderIds, activeIds],
  );

  const setAll = useCallback(() => {
    writeStoredIds([...userProviderIds]);
  }, [userProviderIds]);

  const clear = useCallback(() => {
    writeStoredIds([]);
  }, []);

  const activeSet = useMemo(() => new Set(activeIds), [activeIds]);

  return {
    activeIds,
    activeSet,
    activeCount: activeIds.length,
    totalCount: userProviderIds.length,
    /** Client store is always readable via useSyncExternalStore. */
    ready: true,
    toggle,
    setAll,
    clear,
  };
}
