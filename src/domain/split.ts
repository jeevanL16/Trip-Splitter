import type { Expense, MemberId, Paise } from './types';
import { assertNever } from './types';
import { percentToBasisPoints } from './money';

export interface WeightedMember {
  id: MemberId;
  weight: number;
}

/**
 * Largest-remainder method (Hamilton-Hare).
 * Ties broken by original order of members in the weights array.
 * Guaranteed to allocate every single paisa so sum === total.
 */
export function allocate(
  total: Paise,
  weights: ReadonlyArray<WeightedMember>,
): Record<MemberId, Paise> {
  const result: Record<MemberId, Paise> = {};

  if (weights.length === 0 || total === 0) {
    for (const item of weights) {
      result[item.id] = 0;
    }
    return result;
  }

  let totalWeight = 0;
  for (const item of weights) {
    totalWeight += item.weight;
  }

  if (totalWeight === 0) {
    for (const item of weights) {
      result[item.id] = 0;
    }
    return result;
  }

  interface AllocationItem {
    id: MemberId;
    index: number;
    base: Paise;
    rem: number;
  }

  const items: AllocationItem[] = [];
  let sumBase: Paise = 0;

  for (let i = 0; i < weights.length; i++) {
    const item = weights[i];
    if (!item) {
      continue;
    }
    const product = total * item.weight;
    const base = Math.floor(product / totalWeight);
    const rem = product % totalWeight;
    sumBase += base;
    items.push({ id: item.id, index: i, base, rem });
  }

  const leftover = total - sumBase;

  // Sort by remainder descending; ties broken by original index ascending
  const sortedByRem = [...items].sort((a, b) => {
    if (b.rem !== a.rem) {
      return b.rem - a.rem;
    }
    return a.index - b.index;
  });

  const bonusIds = new Set<MemberId>();
  for (let i = 0; i < leftover && i < sortedByRem.length; i++) {
    const sortedItem = sortedByRem[i];
    if (sortedItem) {
      bonusIds.add(sortedItem.id);
    }
  }

  for (const item of items) {
    const extra = bonusIds.has(item.id) ? 1 : 0;
    result[item.id] = item.base + extra;
  }

  return result;
}

export function computeShares(
  expense: Expense,
  memberOrder: readonly MemberId[],
): Record<MemberId, Paise> {
  switch (expense.split.type) {
    case 'equal': {
      const { memberIds } = expense.split;
      // Filter in trip order, not click order
      const participants = memberOrder.filter((id) => memberIds.includes(id));
      if (participants.length === 0) {
        return {};
      }
      const weights: WeightedMember[] = participants.map((id) => ({
        id,
        weight: 1,
      }));
      return allocate(expense.amount, weights);
    }

    case 'exact': {
      const shares = expense.split.shares;
      const result: Record<MemberId, Paise> = {};
      for (const id of memberOrder) {
        const share = shares[id];
        if (share !== undefined && share > 0) {
          result[id] = share;
        }
      }
      return result;
    }

    case 'percent': {
      const shares = expense.split.shares;
      const participants = memberOrder.filter((id) => {
        const p = shares[id];
        return p !== undefined && p > 0;
      });
      const weights: WeightedMember[] = participants.map((id) => {
        const p = shares[id] ?? 0;
        return {
          id,
          weight: percentToBasisPoints(p),
        };
      });
      return allocate(expense.amount, weights);
    }

    default:
      return assertNever(expense.split);
  }
}
