export type MemberId = string;
export type Paise = number; // integer paise; alias for readability

export interface Member {
  id: MemberId;
  name: string;
}

export const CATEGORIES = ['Food', 'Travel', 'Stay', 'Activities', 'Other'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface EqualSplit {
  type: 'equal';
  memberIds: MemberId[];
}

export interface ExactSplit {
  type: 'exact';
  shares: Record<MemberId, Paise>;
}

export interface PercentSplit {
  type: 'percent';
  shares: Record<MemberId, number>; // percent, <= 2 decimals
}

export type Split = EqualSplit | ExactSplit | PercentSplit;

export interface Expense {
  id: string;
  description: string;
  amount: Paise;
  paidBy: MemberId;
  date: string; // YYYY-MM-DD
  category: Category;
  split: Split;
}

export type NewExpense = Omit<Expense, 'id'>;

export function assertNever(x: never): never {
  throw new Error(`Unexpected object: ${JSON.stringify(x)}`);
}

export function isCategory(v: unknown): v is Category {
  return typeof v === 'string' && CATEGORIES.some((c) => c === v);
}
