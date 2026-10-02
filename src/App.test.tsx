import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from './test/renderWithProviders';
import { App } from './App';

describe('App routing & navigation', () => {
  it('renders navbar and marks active link with aria-current="page" on home route', () => {
    renderWithProviders(<App />, {
      routerProps: { initialEntries: ['/'] },
    });

    const expensesLink = screen.getByRole('link', { name: /^expenses$/i });
    const addExpenseLink = screen.getByRole('link', { name: /^add expense$/i });

    expect(expensesLink).toHaveAttribute('aria-current', 'page');
    expect(addExpenseLink).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('heading', { level: 1, name: /^expenses$/i })).toBeInTheDocument();
  });

  it('marks active link on /expenses/new route', () => {
    renderWithProviders(<App />, {
      routerProps: { initialEntries: ['/expenses/new'] },
    });

    const expensesLink = screen.getByRole('link', { name: /^expenses$/i });
    const addExpenseLink = screen.getByRole('link', { name: /^add expense$/i });

    expect(addExpenseLink).toHaveAttribute('aria-current', 'page');
    expect(expensesLink).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('heading', { level: 1, name: /^add expense$/i })).toBeInTheDocument();
  });

  it('renders Page not found for unknown URLs with a link back to Expenses', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, {
      routerProps: { initialEntries: ['/unknown-path-123'] },
    });

    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    const backLink = screen.getByRole('link', { name: /back to expenses/i });
    expect(backLink).toBeInTheDocument();

    await user.click(backLink);
    expect(screen.getByRole('heading', { level: 1, name: /^expenses$/i })).toBeInTheDocument();
  });
});
