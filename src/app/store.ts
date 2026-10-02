import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { membersSlice } from '../features/expenses/membersSlice';
import { expensesSlice } from '../features/expenses/expensesSlice';

const rootReducer = combineReducers({
  members: membersSlice.reducer,
  expenses: expensesSlice.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
}

export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore['dispatch'];
