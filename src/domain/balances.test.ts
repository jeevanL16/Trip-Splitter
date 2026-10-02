import { describe, it, expect } from 'vitest';
import { computeBalances, balanceStatus } from './balances';
import type { Expense, Member } from './types';
import sampleData from '../data/sample-data.json';

describe('balances domain logic', () => {
  const members: Member[] = sampleData.members;
  // Type assertion in test fixture is standard when importing JSON
  const sampleExpenses = sampleData.expenses as unknown as Expense[];

  it('computes exact golden balances for sample data matching §5.5', () => {
    const balances = computeBalances(members, sampleExpenses);

    expect(balances).toEqual({
      m1: 1855420,
      m2: -369578,
      m3: 55408,
      m4: -811250,
      m5: -730000,
    });

    const sum = Object.values(balances).reduce((acc, val) => acc + val, 0);
    expect(sum).toBe(0);
  });

  it('correctly reports balanceStatus', () => {
    expect(balanceStatus(1855420)).toBe('gets-back');
    expect(balanceStatus(-369578)).toBe('owes');
    expect(balanceStatus(0)).toBe('settled');
  });

  it('handles case where payer is not in the split (buying groceries for others)', () => {
    const tripMembers: Member[] = [
      { id: 'm1', name: 'Aarav' },
      { id: 'm2', name: 'Diya' },
      { id: 'm3', name: 'Kabir' },
    ];

    const expense: Expense = {
      id: 'e1',
      description: 'Groceries for friends',
      amount: 6000, // ₹60
      paidBy: 'm1',
      date: '2026-03-12',
      category: 'Food',
      split: {
        type: 'equal',
        memberIds: ['m2', 'm3'], // m1 not in split!
      },
    };

    const balances = computeBalances(tripMembers, [expense]);

    // m1 paid 6000, owes 0 -> balance +6000
    // m2 owes 3000 -> -3000
    // m3 owes 3000 -> -3000
    expect(balances).toEqual({
      m1: 6000,
      m2: -3000,
      m3: -3000,
    });

    const sum = Object.values(balances).reduce((acc, val) => acc + val, 0);
    expect(sum).toBe(0);
  });

  it('reports settled up when member paid exactly their share', () => {
    const tripMembers: Member[] = [
      { id: 'm1', name: 'Aarav' },
      { id: 'm2', name: 'Diya' },
    ];

    const expense: Expense = {
      id: 'e1',
      description: 'Shared lunch',
      amount: 10000,
      paidBy: 'm1',
      date: '2026-03-12',
      category: 'Food',
      split: {
        type: 'exact',
        shares: { m1: 5000, m2: 5000 },
      },
    };

    // Second expense where m2 pays back
    const expense2: Expense = {
      id: 'e2',
      description: 'Coffee',
      amount: 10000,
      paidBy: 'm2',
      date: '2026-03-12',
      category: 'Food',
      split: {
        type: 'exact',
        shares: { m1: 5000, m2: 5000 },
      },
    };

    const balances = computeBalances(tripMembers, [expense, expense2]);

    expect(balances.m1).toBe(0);
    expect(balances.m2).toBe(0);
    expect(balanceStatus(balances.m1 ?? 0)).toBe('settled');
    expect(balanceStatus(balances.m2 ?? 0)).toBe('settled');
  });

  it('recomputes balances when an expense is deleted', () => {
    const balancesBefore = computeBalances(members, sampleExpenses);
    expect(balancesBefore.m1).toBe(1855420);

    // Delete e1 (Villa booking: 2400000 paid by m1, split equally among all 5 = 480000 each)
    const remainingExpenses = sampleExpenses.filter((e) => e.id !== 'e1');
    const balancesAfter = computeBalances(members, remainingExpenses);

    // m1 was credited 2400000 and debited 480000 (+1920000 net)
    // 1855420 - 1920000 = -64580
    expect(balancesAfter.m1).toBe(1855420 - (2400000 - 480000));

    const sum = Object.values(balancesAfter).reduce((acc, val) => acc + val, 0);
    expect(sum).toBe(0);
  });
});
