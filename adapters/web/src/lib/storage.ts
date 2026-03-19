const STORAGE_PREFIX = 'startup-meeting';

export function saveData<T>(key: string, data: T): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}-${key}`, JSON.stringify(data));
}

export function loadData<T>(key: string): T | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(`${STORAGE_PREFIX}-${key}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function removeData(key: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(`${STORAGE_PREFIX}-${key}`);
}
