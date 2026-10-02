import sampleData from '../data/sample-data.json';
import { parsePersistedState, type PersistedState } from '../domain/guards';

export const STORAGE_KEY = 'trip-splitter:v1';

export function getSampleState(): PersistedState {
  const parsed = parsePersistedState(sampleData);
  if (!parsed) {
    throw new Error('Internal error: sample-data.json failed validation against domain guards');
  }
  return parsed;
}

export function loadState(storage: Storage = localStorage): PersistedState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return getSampleState();
    }
    const json: unknown = JSON.parse(raw);
    const parsed = parsePersistedState(json);
    if (!parsed) {
      return getSampleState();
    }
    return parsed;
  } catch {
    return getSampleState();
  }
}

export function saveState(state: PersistedState, storage: Storage = localStorage): void {
  try {
    const payload = JSON.stringify(state);
    storage.setItem(STORAGE_KEY, payload);
  } catch {
    // QuotaExceededError or private browsing restrictions — silently ignore
  }
}
