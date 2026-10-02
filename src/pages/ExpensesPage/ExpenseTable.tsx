import type { ReactElement } from 'react';
import type { Category, Expense, Member, MemberId, Paise } from '../../domain/types';
import { formatINR } from '../../domain/money';
import { describeSplit } from '../../domain/describe';
import './ExpenseTable.css';

interface ExpenseTableProps {
  expenses: readonly Expense[];
  membersMap: Record<MemberId, Member>;
  totalPaise: Paise;
  categoryFilter: Category | 'All';
  onDeleteClick: (expense: Expense) => void;
}

export function ExpenseTable({
  expenses,
  membersMap,
  totalPaise,
  categoryFilter,
  onDeleteClick,
}: ExpenseTableProps): ReactElement {
  const totalLabel =
    categoryFilter === 'All' ? 'Total' : `Total (${categoryFilter})`;

  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label="Expenses table"
    >
      <table className="expense-table">
        <caption className="sr-only">List of trip expenses</caption>
        <thead>
          <tr>
            <th scope="col" className="col-date">Date</th>
            <th scope="col" className="col-desc">Description</th>
            <th scope="col" className="col-category">Category</th>
            <th scope="col" className="col-paidby">Paid by</th>
            <th scope="col" className="col-amount text-right">Amount</th>
            <th scope="col" className="col-split">Split</th>
            <th scope="col" className="col-actions text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => {
            const payerName = membersMap[expense.paidBy]?.name ?? expense.paidBy;
            const splitText = describeSplit(expense.split);

            return (
              <tr key={expense.id}>
                <td className="col-date font-mono">{expense.date}</td>
                <td className="col-desc font-medium">{expense.description}</td>
                <td className="col-category">
                  <span className="category-tag">{expense.category}</span>
                </td>
                <td className="col-paidby">{payerName}</td>
                <td className="col-amount font-mono text-right font-medium">
                  {formatINR(expense.amount)}
                </td>
                <td className="col-split">{splitText}</td>
                <td className="col-actions text-center">
                  <button
                    type="button"
                    onClick={() => onDeleteClick(expense)}
                    className="delete-row-btn"
                    aria-label={`Delete ${expense.description}`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="expense-table-total-row">
            <th scope="row" colSpan={4} className="text-right">
              {totalLabel}:
            </th>
            <td className="font-mono text-right font-bold">
              {formatINR(totalPaise)}
            </td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
