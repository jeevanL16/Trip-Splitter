import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Expense, NewExpense } from '../../domain/types';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `exp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const initialState: Expense[] = [];

export const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    addExpense: {
      reducer: (state, action: PayloadAction<Expense>) => {
        state.push(action.payload);
      },
      prepare: (newExpense: NewExpense) => ({
        payload: {
          ...newExpense,
          id: generateId(),
        },
      }),
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      return state.filter((e) => e.id !== action.payload);
    },
  },
});

export const { addExpense, deleteExpense } = expensesSlice.actions;
