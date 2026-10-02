import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { Category, Expense, Member, MemberId, Paise } from '../../domain/types';
import { computeBalances } from '../../domain/balances';

export const selectMembers = (state: RootState): Member[] => state.members;
export const selectExpenses = (state: RootState): Expense[] => state.expenses;

export const selectBalances = createSelector(
  [selectMembers, selectExpenses],
  (members, expenses): Record<MemberId, Paise> => computeBalances(members, expenses),
);

export const selectMembersMap = createSelector(
  [selectMembers],
  (members): Record<MemberId, Member> => {
    const map: Record<MemberId, Member> = {};
    for (const m of members) {
      map[m.id] = m;
    }
    return map;
  },
);

export const selectVisibleExpenses = createSelector(
  [
    selectExpenses,
    (_state: RootState, categoryFilter: Category | 'All') => categoryFilter,
  ],
  (expenses, categoryFilter): Expense[] => {
    const filtered =
      categoryFilter === 'All'
        ? expenses
        : expenses.filter((e) => e.category === categoryFilter);

    // Copy array before sorting to avoid mutating Immer-frozen Redux state
    const indexed = filtered.map((item, index) => ({ item, index }));
    indexed.sort((a, b) => {
      if (b.item.date !== a.item.date) {
        return b.item.date.localeCompare(a.item.date);
      }
      return b.index - a.index;
    });

    return indexed.map((x) => x.item);
  },
);

export const selectTotalPaise = createSelector(
  [selectVisibleExpenses],
  (visibleExpenses): Paise => {
    return visibleExpenses.reduce((sum, e) => sum + e.amount, 0);
  },
);
