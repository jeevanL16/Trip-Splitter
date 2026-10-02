import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ExpensesPage } from './ExpensesPage';
import { getSampleState } from '../../app/persistence';

describe('ExpensesPage', () => {
  it('renders golden balance summary for sample data matching §5.5', () => {
    const sampleState = getSampleState();
    renderWithProviders(<ExpensesPage />, {
      preloadedState: sampleState,
    });

    // Check balances text
    expect(screen.getByText(/Aarav — gets back ₹18,554.20/i)).toBeInTheDocument();
    expect(screen.getByText(/Diya — owes ₹3,695.78/i)).toBeInTheDocument();
    expect(screen.getByText(/Kabir — gets back ₹554.08/i)).toBeInTheDocument();
    expect(screen.getByText(/Meera — owes ₹8,112.50/i)).toBeInTheDocument();
    expect(screen.getByText(/Rohan — owes ₹7,300.00/i)).toBeInTheDocument();
  });

  it('renders rows sorted newest first and calculates total of visible rows', () => {
    const sampleState = getSampleState();
    renderWithProviders(<ExpensesPage />, {
      preloadedState: sampleState,
    });

    const rows = screen.getAllByRole('row');
    // Header row + 6 sample expenses + 1 total row = 8 rows
    expect(rows).toHaveLength(8);

    // Row 1 (index 1) should be e6 (2026-03-15 Airport cab)
    expect(rows[1]).toHaveTextContent('2026-03-15');
    expect(rows[1]).toHaveTextContent('Airport cab');

    // Total row should display total ₹42,249.99
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('₹42,249.99')).toBeInTheDocument();
  });

  it('filters expenses by category and updates rows and total', async () => {
    const user = userEvent.setup();
    const sampleState = getSampleState();
    renderWithProviders(<ExpensesPage />, {
      preloadedState: sampleState,
    });

    const select = screen.getByLabelText(/filter by category/i);
    await user.selectOptions(select, 'Food');

    // Sample data has 2 food expenses: Beach shack dinner (₹3,250.00) and Groceries (₹1,000.00)
    // Sum = ₹4,250.00
    expect(screen.getByText('Beach shack dinner')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.queryByText('Villa booking')).not.toBeInTheDocument();

    expect(screen.getByText('Total (Food):')).toBeInTheDocument();
    expect(screen.getByText('₹4,250.00')).toBeInTheDocument();
  });

  it('opens confirmation dialog on delete, cancels properly without deleting', async () => {
    const user = userEvent.setup();
    const sampleState = getSampleState();
    const { store } = renderWithProviders(<ExpensesPage />, {
      preloadedState: sampleState,
    });

    const deleteBtn = screen.getByRole('button', { name: /delete airport cab/i });
    await user.click(deleteBtn);

    // Confirmation dialog appears
    expect(
      screen.getByText(/Are you sure you want to delete "Airport cab"/i),
    ).toBeInTheDocument();

    // Click Cancel
    const cancelBtn = screen.getByRole('button', { name: /^cancel$/i });
    await user.click(cancelBtn);

    // Row is still present
    expect(screen.getByText('Airport cab')).toBeInTheDocument();
    expect(store.getState().expenses).toHaveLength(6);
  });

  it('deletes expense when confirmed, updating table and balances immediately', async () => {
    const user = userEvent.setup();
    const sampleState = getSampleState();
    const { store } = renderWithProviders(<ExpensesPage />, {
      preloadedState: sampleState,
    });

    const deleteBtn = screen.getByRole('button', { name: /delete airport cab/i });
    await user.click(deleteBtn);

    // Click Delete in dialog
    const confirmBtn = screen.getByRole('button', { name: /^delete$/i });
    await user.click(confirmBtn);

    // Airport cab is removed
    expect(screen.queryByText('Airport cab')).not.toBeInTheDocument();
    expect(store.getState().expenses).toHaveLength(5);

    // Aarav paid for Airport cab (149999), balance updates immediately
    expect(screen.queryByText(/Aarav — gets back ₹18,554.20/i)).not.toBeInTheDocument();
  });

  it('renders empty state when there are no expenses at all', () => {
    const sampleState = getSampleState();
    renderWithProviders(<ExpensesPage />, {
      preloadedState: {
        ...sampleState,
        expenses: [],
      },
    });

    expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add the first expense/i })).toBeInTheDocument();

    // Balances still render showing settled up
    expect(screen.getByText(/Aarav — settled up/i)).toBeInTheDocument();
    expect(screen.getByText(/Diya — settled up/i)).toBeInTheDocument();
  });

  it('renders category empty state when no expenses match category, with working "Show all" button', async () => {
    const user = userEvent.setup();
    const sampleState = getSampleState();
    renderWithProviders(<ExpensesPage />, {
      preloadedState: sampleState,
    });

    const select = screen.getByLabelText(/filter by category/i);
    // Sample data has no "Other" category expenses
    await user.selectOptions(select, 'Other');

    expect(screen.getByText(/no expenses in other/i)).toBeInTheDocument();
    const showAllBtn = screen.getByRole('button', { name: /show all/i });
    expect(showAllBtn).toBeInTheDocument();

    await user.click(showAllBtn);
    expect(screen.getByText('Villa booking')).toBeInTheDocument();
  });

  it('displays flash message if present in location.state and dismisses it', async () => {
    const user = userEvent.setup();
    const sampleState = getSampleState();
    renderWithProviders(<ExpensesPage />, {
      preloadedState: sampleState,
      routerProps: {
        initialEntries: [
          {
            pathname: '/',
            state: { flash: 'Expense added' },
          },
        ],
      },
    });

    expect(screen.getByRole('status')).toHaveTextContent('Expense added');
    const dismissBtn = screen.getByRole('button', { name: /dismiss notification/i });
    await user.click(dismissBtn);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
