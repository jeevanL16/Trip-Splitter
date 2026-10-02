import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '../domain/types';
import './EmptyState.css';

interface EmptyStateProps {
  type: 'no-expenses' | 'no-category-matches';
  category?: Category;
  onResetCategory?: () => void;
}

export function EmptyState({
  type,
  category,
  onResetCategory,
}: EmptyStateProps): ReactElement {
  if (type === 'no-expenses') {
    return (
      <div className="empty-state-card">
        <div className="empty-state-icon" aria-hidden="true">
          🧾
        </div>
        <h3 className="empty-state-title">No expenses yet</h3>
        <p className="empty-state-desc">
          Get started by adding your first trip expense to see balances and split calculations.
        </p>
        <Link to="/expenses/new" className="empty-state-btn">
          Add the first expense
        </Link>
      </div>
    );
  }

  return (
    <div className="empty-state-card">
      <div className="empty-state-icon" aria-hidden="true">
        🔍
      </div>
      <h3 className="empty-state-title">No expenses in {category}</h3>
      <p className="empty-state-desc">
        There are no recorded expenses matching this category.
      </p>
      {onResetCategory && (
        <button
          type="button"
          onClick={onResetCategory}
          className="empty-state-btn empty-state-btn-secondary"
        >
          Show all
        </button>
      )}
    </div>
  );
}
