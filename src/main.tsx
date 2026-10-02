import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { setupStore } from './app/store';
import { loadState, saveState } from './app/persistence';
import { App } from './App';

const initialPersistedState = loadState();
export const store = setupStore(initialPersistedState);

// Subscribe to store updates to persist changes when expenses change
let prevExpenses = store.getState().expenses;
store.subscribe(() => {
  const state = store.getState();
  if (state.expenses !== prevExpenses) {
    prevExpenses = state.expenses;
    saveState({ members: state.members, expenses: state.expenses });
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
