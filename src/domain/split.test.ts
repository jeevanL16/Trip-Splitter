import { describe, it, expect } from 'vitest';
import { allocate, computeShares } from './split';
import type { Expense, MemberId } from './types';

describe('split domain logic', () => {
  const tripMembers: MemberId[] = ['m1', 'm2', 'm3', 'm4', 'm5'];

  it('allocates ₹100 split equally among 3 members: ₹33.34, ₹33.33, ₹33.33', () => {
    const total = 10000; // ₹100 in paise
    const weights = [
      { id: 'm1', weight: 1 },
      { id: 'm2', weight: 1 },
      { id: 'm3', weight: 1 },
    ];
    const result = allocate(total, weights);

    expect(result).toEqual({
      m1: 3334,
      m2: 3333,
      m3: 3333,
    });
    expect(result.m1! + result.m2! + result.m3!).toBe(10000);
  });

  it('preserves trip order for extra paisa regardless of input selection order in equal split', () => {
    const expense: Expense = {
      id: 'test-equal',
      description: 'Dinner',
      amount: 10000,
      paidBy: 'm1',
      date: '2026-03-12',
      category: 'Food',
      // selected in reverse order: m3, m2, m1
      split: { type: 'equal', memberIds: ['m3', 'm2', 'm1'] },
    };

    const shares = computeShares(expense, tripMembers);

    // m1 is first in tripMembers, so m1 gets 3334
    expect(shares).toEqual({
      m1: 3334,
      m2: 3333,
      m3: 3333,
    });
  });

  it('matches sample data e6 percentage split: ₹1,499.99 at 33.33 / 33.33 / 33.34', () => {
    const expense: Expense = {
      id: 'e6',
      description: 'Airport cab',
      amount: 149999,
      paidBy: 'm1',
      date: '2026-03-15',
      category: 'Travel',
      split: {
        type: 'percent',
        shares: { m1: 33.33, m2: 33.33, m3: 33.34 },
      },
    };

    const shares = computeShares(expense, tripMembers);

    expect(shares).toEqual({
      m1: 49995,
      m2: 49995,
      m3: 50009,
    });
    expect(shares.m1! + shares.m2! + shares.m3!).toBe(149999);
  });

  it('passes exact split shares through directly', () => {
    const expense: Expense = {
      id: 'e3',
      description: 'Scuba diving',
      amount: 1050000,
      paidBy: 'm3',
      date: '2026-03-13',
      category: 'Activities',
      split: {
        type: 'exact',
        shares: { m3: 350000, m4: 350000, m5: 350000 },
      },
    };

    const shares = computeShares(expense, tripMembers);

    expect(shares).toEqual({
      m3: 350000,
      m4: 350000,
      m5: 350000,
    });
  });

  it('guarantees invariant sum === amount and max - min <= 1 across all amounts 1..500 and n 1..7', () => {
    for (let n = 1; n <= 7; n++) {
      const ids: MemberId[] = Array.from({ length: n }, (_, i) => `mem_${i + 1}`);
      const weights = ids.map((id) => ({ id, weight: 1 }));

      for (let amt = 1; amt <= 500; amt++) {
        const alloc = allocate(amt, weights);
        const values = Object.values(alloc);

        const sum = values.reduce((acc, v) => acc + v, 0);
        expect(sum).toBe(amt);

        const max = Math.max(...values);
        const min = Math.min(...values);
        expect(max - min).toBeLessThanOrEqual(1);
      }
    }
  });
});
