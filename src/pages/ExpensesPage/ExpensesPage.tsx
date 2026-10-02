import { useEffect, useState, type ReactElement } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  selectBalances,
  selectExpenses,
  selectMembers,
  selectMembersMap,
  selectVisibleExpenses,
} from '../../features/expenses/selectors';
import { deleteExpense } from '../../features/expenses/expensesSlice';
import type { Category, Expense } from '../../domain/types';
import { isRecord } from '../../domain/guards';
import { formatINR } from '../../domain/money';
import { BalanceSummary } from './BalanceSummary';
import { CategoryFilter } from './CategoryFilter';
import { ExpenseTable } from './ExpenseTable';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import './ExpensesPage.css';

function getFlash(state: unknown): string | null {
  if (isRecord(state) && typeof state['flash'] === 'string') {
    return state['flash'];
  }
  return null;
}

export function ExpensesPage(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [flashMessage, setFlashMessage] = useState<string | null>(() =>
    getFlash(location.state),
  );

  useEffect(() => {
    document.title = 'Expenses | Trip Splitter';
  }, []);

  useEffect(() => {
    if (flashMessage) {
      void navigate(location.pathname, { replace: true, state: null });
    }
  }, [flashMessage, location.pathname, navigate]);

  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const members = useAppSelector(selectMembers);
  const allExpenses = useAppSelector(selectExpenses);
  const balances = useAppSelector(selectBalances);
  const membersMap = useAppSelector(selectMembersMap);

  const visibleExpenses = useAppSelector((state) =>
    selectVisibleExpenses(state, categoryFilter),
  );

  const totalPaise = visibleExpenses.reduce((sum, e) => sum + e.amount, 0);

  function handleDeleteConfirm(): void {
    if (expenseToDelete) {
      dispatch(deleteExpense(expenseToDelete.id));
      setExpenseToDelete(null);
    }
  }

  return (
    <div className="expenses-page">
      {flashMessage && (
        <div role="status" className="flash-banner">
          <span className="flash-icon" aria-hidden="true">
            ✓
          </span>
          <span className="flash-text">{flashMessage}</span>
          <button
            type="button"
            className="flash-close-btn"
            onClick={() => setFlashMessage(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      <div className="expenses-header-row">
        <div>
          <h1 className="expenses-main-title">Expenses</h1>
          <p className="expenses-main-desc">
            Track and split travel expenses accurately across trip members.
          </p>
        </div>
        <Link to="/expenses/new" className="add-expense-cta">
          + Add expense
        </Link>
      </div>

      <BalanceSummary members={members} balances={balances} />

      <section aria-labelledby="expenses-list-heading" className="expenses-list-section">
        <div className="expenses-toolbar">
          <h2 id="expenses-list-heading" className="expenses-list-title">
            All Expenses ({allExpenses.length})
          </h2>
          <CategoryFilter
            value={categoryFilter}
            onChange={(cat) => setCategoryFilter(cat)}
          />
        </div>

        {allExpenses.length === 0 ? (
          <EmptyState type="no-expenses" />
        ) : visibleExpenses.length === 0 ? (
          <EmptyState
            type="no-category-matches"
            category={categoryFilter !== 'All' ? categoryFilter : undefined}
            onResetCategory={() => setCategoryFilter('All')}
          />
        ) : (
          <ExpenseTable
            expenses={visibleExpenses}
            membersMap={membersMap}
            totalPaise={totalPaise}
            categoryFilter={categoryFilter}
            onDeleteClick={(expense) => setExpenseToDelete(expense)}
          />
        )}
      </section>

      <ConfirmDialog
        isOpen={expenseToDelete !== null}
        title="Delete expense"
        message={
          expenseToDelete
            ? `Are you sure you want to delete "${expenseToDelete.description}" (${formatINR(expenseToDelete.amount)})? This will update all member balances immediately.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setExpenseToDelete(null)}
      />
    </div>
  );
}
