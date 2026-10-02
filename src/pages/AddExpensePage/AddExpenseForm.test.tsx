import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route, useLocation } from 'react-router-dom';
import { renderWithProviders } from '../../test/renderWithProviders';
import { AddExpensePage } from './AddExpensePage';
import { getSampleState } from '../../app/persistence';
import { isRecord } from '../../domain/guards';

function getFlashFromLocation(state: unknown): string | null {
  if (isRecord(state) && typeof state['flash'] === 'string') {
    return state['flash'];
  }
  return null;
}

function StubHome() {
  const location = useLocation();
  const flash = getFlashFromLocation(location.state);
  return (
    <div>
      <h1>Expenses</h1>
      {flash && <div data-testid="flash-message">{flash}</div>}
    </div>
  );
}

function renderAddExpensePage() {
  const sampleState = getSampleState();
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<StubHome />} />
      <Route path="/expenses/new" element={<AddExpensePage />} />
    </Routes>,
    {
      preloadedState: sampleState,
      routerProps: { initialEntries: ['/expenses/new'] },
    },
  );
}

describe('AddExpenseForm', () => {
  it('1. Submitting empty form shows errors next to invalid fields; store unchanged', async () => {
    const user = userEvent.setup();
    const { store } = renderAddExpensePage();
    const initialCount = store.getState().expenses.length;

    const saveButton = screen.getByRole('button', { name: /save expense/i });
    await user.click(saveButton);

    expect(screen.getByText('Description is required')).toBeInTheDocument();
    expect(screen.getByText('Amount is required')).toBeInTheDocument();
    expect(screen.getByText('Select who paid')).toBeInTheDocument();
    expect(screen.getByText('Select a category')).toBeInTheDocument();

    expect(store.getState().expenses).toHaveLength(initialCount);
  });

  it('2. Amount -5 shows "Amount must be more than ₹0"', async () => {
    const user = userEvent.setup();
    renderAddExpensePage();

    const amountInput = screen.getByLabelText(/amount \(₹\)/i);
    await user.type(amountInput, '-5');

    const saveButton = screen.getByRole('button', { name: /save expense/i });
    await user.click(saveButton);

    expect(screen.getByText('Amount must be more than ₹0')).toBeInTheDocument();
  });

  it('3. Description with 61 characters shows length error', async () => {
    const user = userEvent.setup();
    renderAddExpensePage();

    const descInput = screen.getByLabelText(/description/i);
    const longDesc = 'a'.repeat(61);
    await user.type(descInput, longDesc);

    const saveButton = screen.getByRole('button', { name: /save expense/i });
    await user.click(saveButton);

    expect(
      screen.getByText('Description must be 60 characters or fewer'),
    ).toBeInTheDocument();
  });

  it('4. Exact split with sum short shows "₹12.50 left to assign"; nothing saved', async () => {
    const user = userEvent.setup();
    const { store } = renderAddExpensePage();
    const initialCount = store.getState().expenses.length;

    await user.type(screen.getByLabelText(/description/i), 'Lunch');
    await user.type(screen.getByLabelText(/amount \(₹\)/i), '100');
    await user.selectOptions(screen.getByLabelText(/paid by/i), 'm1');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Food');

    // Switch to Exact amounts
    await user.click(screen.getByLabelText(/exact amounts/i));

    // Fill Aarav with 50 and Diya with 37.50 -> 87.50 total (short by 12.50)
    const aaravExact = screen.getByLabelText(/aarav — amount \(₹\)/i);
    const diyaExact = screen.getByLabelText(/diya — amount \(₹\)/i);
    await user.type(aaravExact, '50');
    await user.type(diyaExact, '37.50');

    await user.click(screen.getByRole('button', { name: /save expense/i }));

    expect(screen.getByText('₹12.50 left to assign')).toBeInTheDocument();
    expect(store.getState().expenses).toHaveLength(initialCount);
  });

  it('5. Percent split not totalling 100 shows error; nothing saved', async () => {
    const user = userEvent.setup();
    const { store } = renderAddExpensePage();
    const initialCount = store.getState().expenses.length;

    await user.type(screen.getByLabelText(/description/i), 'Cab');
    await user.type(screen.getByLabelText(/amount \(₹\)/i), '1000');
    await user.selectOptions(screen.getByLabelText(/paid by/i), 'm1');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Travel');

    // Switch to Percentages
    await user.click(screen.getByLabelText(/percentages/i));

    // Fill Aarav with 50, Diya with 40 -> 90% total
    await user.type(screen.getByLabelText(/aarav — percent \(%\)/i), '50');
    await user.type(screen.getByLabelText(/diya — percent \(%\)/i), '40');

    await user.click(screen.getByRole('button', { name: /save expense/i }));

    expect(
      screen.getByText(/percentages must add up to 100 \(currently 90, 10 left\)/i),
    ).toBeInTheDocument();
    expect(store.getState().expenses).toHaveLength(initialCount);
  });

  it('6. Equal split with all unchecked shows "Select at least one member"', async () => {
    const user = userEvent.setup();
    renderAddExpensePage();

    // Default has all 5 members checked. Uncheck all of them.
    const sampleMembers = getSampleState().members;
    for (const m of sampleMembers) {
      const checkbox = screen.getByLabelText(m.name);
      await user.click(checkbox);
    }

    await user.click(screen.getByRole('button', { name: /save expense/i }));
    expect(screen.getByText('Select at least one member')).toBeInTheDocument();
  });

  it('7. Valid input (equal split) adds expense to store, redirects to / with flash', async () => {
    const user = userEvent.setup();
    const { store } = renderAddExpensePage();
    const initialCount = store.getState().expenses.length;

    await user.type(screen.getByLabelText(/description/i), 'Team Dinner');
    await user.type(screen.getByLabelText(/amount \(₹\)/i), '1500.50');
    await user.selectOptions(screen.getByLabelText(/paid by/i), 'm1');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Food');

    await user.click(screen.getByRole('button', { name: /save expense/i }));

    // Redirected to /
    expect(screen.getByRole('heading', { level: 1, name: /expenses/i })).toBeInTheDocument();
    expect(screen.getByTestId('flash-message')).toHaveTextContent('Expense added');

    // Store has new expense
    const expenses = store.getState().expenses;
    expect(expenses).toHaveLength(initialCount + 1);
    const added = expenses[expenses.length - 1];
    expect(added?.description).toBe('Team Dinner');
    expect(added?.amount).toBe(150050); // 1500.50 in paise
    expect(added?.paidBy).toBe('m1');
    expect(added?.category).toBe('Food');
    expect(added?.split.type).toBe('equal');
  });

  it('8. Valid exact and percent splits save correctly', async () => {
    const user = userEvent.setup();
    const { store } = renderAddExpensePage();

    // Test Exact save
    await user.type(screen.getByLabelText(/description/i), 'Museum Tickets');
    await user.type(screen.getByLabelText(/amount \(₹\)/i), '500');
    await user.selectOptions(screen.getByLabelText(/paid by/i), 'm2');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Activities');

    await user.click(screen.getByLabelText(/exact amounts/i));
    await user.type(screen.getByLabelText(/aarav — amount \(₹\)/i), '300');
    await user.type(screen.getByLabelText(/diya — amount \(₹\)/i), '200');

    await user.click(screen.getByRole('button', { name: /save expense/i }));

    const expenses = store.getState().expenses;
    const exactExpense = expenses[expenses.length - 1];
    expect(exactExpense?.description).toBe('Museum Tickets');
    expect(exactExpense?.amount).toBe(50000);
    expect(exactExpense?.split).toEqual({
      type: 'exact',
      shares: { m1: 30000, m2: 20000 },
    });
  });

  it('9. Cancel navigates without saving to store', async () => {
    const user = userEvent.setup();
    const { store } = renderAddExpensePage();
    const initialCount = store.getState().expenses.length;

    await user.type(screen.getByLabelText(/description/i), 'Unsaved Trip');
    await user.type(screen.getByLabelText(/amount \(₹\)/i), '500');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(store.getState().expenses).toHaveLength(initialCount);
  });

  it('10. Errors clear live as user corrects fields (derived-errors design)', async () => {
    const user = userEvent.setup();
    renderAddExpensePage();

    const saveButton = screen.getByRole('button', { name: /save expense/i });
    await user.click(saveButton);

    // Initial errors shown
    expect(screen.getByText('Description is required')).toBeInTheDocument();

    // Type into description -> error disappears immediately without another submit!
    const descInput = screen.getByLabelText(/description/i);
    await user.type(descInput, 'Coffee');
    expect(screen.queryByText('Description is required')).not.toBeInTheDocument();
  });
});
