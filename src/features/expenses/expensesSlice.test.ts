import { describe, it, expect } from 'vitest';
import { expensesSlice, addExpense, deleteExpense } from './expensesSlice';
import { setupStore } from '../../app/store';
import {
  selectVisibleExpenses,
  selectTotalPaise,
  selectBalances,
} from './selectors';
import type { Expense, NewExpense } from '../../domain/types';

describe('expensesSlice', () => {
  it('adds an expense with an auto-generated id and appends to state', () => {
    const initialState: Expense[] = [];
    const newExpense: NewExpense = {
      description: 'Dinner',
      amount: 5000,
      paidBy: 'm1',
      date: '2026-03-12',
      category: 'Food',
      split: { type: 'equal', memberIds: ['m1', 'm2'] },
    };

    const action = addExpense(newExpense);
    expect(action.payload.id).toBeDefined();
    expect(typeof action.payload.id).toBe('string');
    expect(action.payload.id.length).toBeGreaterThan(0);

    const nextState = expensesSlice.reducer(initialState, action);
    expect(nextState).toHaveLength(1);
    expect(nextState[0]?.description).toBe('Dinner');
    expect(nextState[0]?.id).toBe(action.payload.id);
  });

  it('deletes an expense by id', () => {
    const initialExpenses: Expense[] = [
      {
        id: 'e1',
        description: 'Hotel',
        amount: 20000,
        paidBy: 'm1',
        date: '2026-03-12',
        category: 'Stay',
        split: { type: 'equal', memberIds: ['m1'] },
      },
      {
        id: 'e2',
        description: 'Flight',
        amount: 50000,
        paidBy: 'm2',
        date: '2026-03-13',
        category: 'Travel',
        split: { type: 'equal', memberIds: ['m2'] },
      },
    ];

    const nextState = expensesSlice.reducer(initialExpenses, deleteExpense('e1'));
    expect(nextState).toHaveLength(1);
    expect(nextState[0]?.id).toBe('e2');
  });

  describe('selectors', () => {
    it('filters by category and sorts newest first', () => {
      const store = setupStore({
        members: [{ id: 'm1', name: 'Aarav' }],
        expenses: [
          {
            id: 'e1',
            description: 'Lunch 1',
            amount: 1000,
            paidBy: 'm1',
            date: '2026-03-10',
            category: 'Food',
            split: { type: 'equal', memberIds: ['m1'] },
          },
          {
            id: 'e2',
            description: 'Taxi',
            amount: 2000,
            paidBy: 'm1',
            date: '2026-03-12',
            category: 'Travel',
            split: { type: 'equal', memberIds: ['m1'] },
          },
          {
            id: 'e3',
            description: 'Lunch 2',
            amount: 3000,
            paidBy: 'm1',
            date: '2026-03-12',
            category: 'Food',
            split: { type: 'equal', memberIds: ['m1'] },
          },
        ],
      });

      const state = store.getState();
      const allExpenses = selectVisibleExpenses(state, 'All');
      // e2 and e3 have date 2026-03-12, e3 was added after e2, so e3 comes first
      expect(allExpenses.map((e) => e.id)).toEqual(['e3', 'e2', 'e1']);

      const foodExpenses = selectVisibleExpenses(state, 'Food');
      expect(foodExpenses.map((e) => e.id)).toEqual(['e3', 'e1']);

      const foodTotal = selectTotalPaise.resultFunc(foodExpenses);
      expect(foodTotal).toBe(4000);
    });

    it('computes balances reactively when an expense is deleted', () => {
      const store = setupStore({
        members: [
          { id: 'm1', name: 'Aarav' },
          { id: 'm2', name: 'Diya' },
        ],
        expenses: [
          {
            id: 'e1',
            description: 'Lunch',
            amount: 10000,
            paidBy: 'm1',
            date: '2026-03-12',
            category: 'Food',
            split: { type: 'equal', memberIds: ['m1', 'm2'] },
          },
        ],
      });

      let balances = selectBalances(store.getState());
      expect(balances.m1).toBe(5000);
      expect(balances.m2).toBe(-5000);

      store.dispatch(deleteExpense('e1'));
      balances = selectBalances(store.getState());
      expect(balances.m1).toBe(0);
      expect(balances.m2).toBe(0);
    });
  });
});
