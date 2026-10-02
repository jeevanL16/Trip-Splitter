import { describe, it, expect } from 'vitest';
import { loadState, saveState, STORAGE_KEY } from './persistence';
import type { PersistedState } from '../domain/guards';

class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

describe('persistence', () => {
  it('falls back to sample data when storage is empty', () => {
    const storage = new MockStorage();
    const state = loadState(storage);
    expect(state.members).toHaveLength(5);
    expect(state.expenses).toHaveLength(6);
  });

  it('falls back to sample data when storage contains invalid JSON', () => {
    const storage = new MockStorage();
    storage.setItem(STORAGE_KEY, '{ invalid json');
    const state = loadState(storage);
    expect(state.members).toHaveLength(5);
    expect(state.expenses).toHaveLength(6);
  });

  it('falls back to sample data when JSON does not conform to domain guards', () => {
    const storage = new MockStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ members: [], expenses: [] }));
    const state = loadState(storage);
    expect(state.members).toHaveLength(5);
    expect(state.expenses).toHaveLength(6);
  });

  it('performs round-trip save and load accurately', () => {
    const storage = new MockStorage();
    const initial = loadState(storage);

    const modified: PersistedState = {
      ...initial,
      expenses: initial.expenses.slice(0, 2),
    };

    saveState(modified, storage);
    const loaded = loadState(storage);

    expect(loaded.expenses).toHaveLength(2);
    expect(loaded.expenses[0]?.id).toBe('e1');
  });

  it('does not throw when setItem throws (quota exceeded)', () => {
    const throwingStorage = new MockStorage();
    throwingStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    const initial = loadState(throwingStorage);
    expect(() => {
      saveState(initial, throwingStorage);
    }).not.toThrow();
  });
});
