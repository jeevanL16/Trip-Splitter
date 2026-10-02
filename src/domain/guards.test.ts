import { describe, it, expect } from 'vitest';
import { parsePersistedState, parseSplit, parseExpense } from './guards';
import sampleData from '../data/sample-data.json';

describe('guards domain logic', () => {
  it('successfully parses sample-data.json without errors', () => {
    const parsed = parsePersistedState(sampleData);
    expect(parsed).not.toBeNull();
    expect(parsed?.members).toHaveLength(5);
    expect(parsed?.expenses).toHaveLength(6);
  });

  it('rejects invalid members array or duplicates', () => {
    expect(parsePersistedState({ members: [], expenses: [] })).toBeNull();
    expect(parsePersistedState({ members: 'not-array', expenses: [] })).toBeNull();
    expect(
      parsePersistedState({
        members: [
          { id: 'm1', name: 'Aarav' },
          { id: 'm1', name: 'Duplicate Aarav' },
        ],
        expenses: [],
      }),
    ).toBeNull();
  });

  it('rejects exact split where shares do not sum to expense amount', () => {
    const knownIds = new Set(['m1', 'm2']);
    const badExactSplit = {
      type: 'exact',
      shares: { m1: 5000, m2: 4000 }, // sum 9000 !== 10000
    };
    expect(parseSplit(badExactSplit, 10000, knownIds)).toBeNull();
  });

  it('rejects percent split where percentages do not sum to 100', () => {
    const knownIds = new Set(['m1', 'm2']);
    const badPercentSplit = {
      type: 'percent',
      shares: { m1: 50, m2: 49.9 }, // sum 99.9 !== 100
    };
    expect(parseSplit(badPercentSplit, 10000, knownIds)).toBeNull();
  });

  it('rejects expense with unknown paidBy member', () => {
    const knownIds = new Set(['m1']);
    const expenseWithBadPayer = {
      id: 'e1',
      description: 'Coffee',
      amount: 1000,
      paidBy: 'm999',
      date: '2026-03-12',
      category: 'Food',
      split: { type: 'equal', memberIds: ['m1'] },
    };
    expect(parseExpense(expenseWithBadPayer, knownIds)).toBeNull();
  });

  it('rejects expense with invalid ISO date or negative amount', () => {
    const knownIds = new Set(['m1']);
    expect(
      parseExpense(
        {
          id: 'e1',
          description: 'Coffee',
          amount: -100,
          paidBy: 'm1',
          date: '2026-03-12',
          category: 'Food',
          split: { type: 'equal', memberIds: ['m1'] },
        },
        knownIds,
      ),
    ).toBeNull();

    expect(
      parseExpense(
        {
          id: 'e1',
          description: 'Coffee',
          amount: 1000,
          paidBy: 'm1',
          date: '2026-02-30',
          category: 'Food',
          split: { type: 'equal', memberIds: ['m1'] },
        },
        knownIds,
      ),
    ).toBeNull();
  });
});
