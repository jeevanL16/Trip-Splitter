import type { ReactElement } from 'react';
import { AddExpenseForm } from './AddExpenseForm';
import './AddExpensePage.css';

export function AddExpensePage(): ReactElement {
  return (
    <div className="add-expense-page">
      <div className="add-expense-header">
        <h1 className="add-expense-title">Add Expense</h1>
        <p className="add-expense-subtitle">
          Record a new expense and specify how it should be split among trip members.
        </p>
      </div>

      <AddExpenseForm />
    </div>
  );
}
