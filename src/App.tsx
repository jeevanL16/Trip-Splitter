import type { ReactElement } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ExpensesPage } from './pages/ExpensesPage/ExpensesPage';
import { AddExpensePage } from './pages/AddExpensePage/AddExpensePage';
import { NotFoundPage } from './pages/NotFoundPage';
import './styles/tokens.css';
import './styles/base.css';

export function App(): ReactElement {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ExpensesPage />} />
        <Route path="expenses/new" element={<AddExpensePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
