import type { Expense, Member, MemberId, Paise } from './types';
import { computeShares } from './split';

export type BalanceStatus = 'gets-back' | 'owes' | 'settled';

export function balanceStatus(balance: Paise): BalanceStatus {
  if (balance > 0) {
    return 'gets-back';
  }
  if (balance < 0) {
    return 'owes';
  }
  return 'settled';
}

export function computeBalances(
  members: readonly Member[],
  expenses: readonly Expense[],
): Record<MemberId, Paise> {
  const memberOrder = members.map((m) => m.id);
  const balances: Record<MemberId, Paise> = {};

  for (const member of members) {
    balances[member.id] = 0;
  }

  for (const expense of expenses) {
    // Payer gets credit for the entire amount they paid
    const currentPaid = balances[expense.paidBy] ?? 0;
    balances[expense.paidBy] = currentPaid + expense.amount;

    // Each participant is charged their computed share
    const shares = computeShares(expense, memberOrder);
    for (const [memberId, share] of Object.entries(shares)) {
      const currentBalance = balances[memberId] ?? 0;
      balances[memberId] = currentBalance - share;
    }
  }

  return balances;
}
