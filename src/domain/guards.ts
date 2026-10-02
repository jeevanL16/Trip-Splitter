import type {
  Category,
  EqualSplit,
  ExactSplit,
  Expense,
  Member,
  MemberId,
  Paise,
  PercentSplit,
  Split,
} from './types';
import { isCategory } from './types';
import { MAX_AMOUNT_PAISE, percentToBasisPoints } from './money';
import { isValidISODate } from './dates';

export interface PersistedState {
  members: Member[];
  expenses: Expense[];
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function parseMember(v: unknown): Member | null {
  if (!isRecord(v)) {
    return null;
  }
  const { id, name } = v;
  if (typeof id !== 'string' || id.trim() === '') {
    return null;
  }
  if (typeof name !== 'string' || name.trim() === '') {
    return null;
  }
  return { id, name };
}

export function parseMembers(v: unknown): Member[] | null {
  if (!Array.isArray(v) || v.length === 0) {
    return null;
  }
  const members: Member[] = [];
  const seenIds = new Set<MemberId>();

  for (const item of v) {
    const member = parseMember(item);
    if (!member || seenIds.has(member.id)) {
      return null;
    }
    seenIds.add(member.id);
    members.push(member);
  }

  return members;
}

export function parseSplit(
  v: unknown,
  amount: Paise,
  knownMemberIds: ReadonlySet<MemberId>,
): Split | null {
  if (!isRecord(v) || typeof v['type'] !== 'string') {
    return null;
  }

  const type = v['type'];

  if (type === 'equal') {
    const memberIds = v['memberIds'];
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return null;
    }
    const seen = new Set<MemberId>();
    const validIds: MemberId[] = [];
    for (const id of memberIds) {
      if (typeof id !== 'string' || !knownMemberIds.has(id) || seen.has(id)) {
        return null;
      }
      seen.add(id);
      validIds.push(id);
    }
    const equalSplit: EqualSplit = { type: 'equal', memberIds: validIds };
    return equalSplit;
  }

  if (type === 'exact') {
    const shares = v['shares'];
    if (!isRecord(shares)) {
      return null;
    }
    const exactShares: Record<MemberId, Paise> = {};
    let sumPaise: Paise = 0;

    for (const [id, rawShare] of Object.entries(shares)) {
      if (!knownMemberIds.has(id)) {
        return null;
      }
      if (typeof rawShare !== 'number' || !Number.isInteger(rawShare) || rawShare < 0) {
        return null;
      }
      if (rawShare > 0) {
        exactShares[id] = rawShare;
        sumPaise += rawShare;
      }
    }

    if (sumPaise !== amount) {
      return null;
    }

    const exactSplit: ExactSplit = { type: 'exact', shares: exactShares };
    return exactSplit;
  }

  if (type === 'percent') {
    const shares = v['shares'];
    if (!isRecord(shares)) {
      return null;
    }
    const percentShares: Record<MemberId, number> = {};
    let sumBasisPoints = 0;

    for (const [id, rawPercent] of Object.entries(shares)) {
      if (!knownMemberIds.has(id)) {
        return null;
      }
      if (typeof rawPercent !== 'number' || rawPercent < 0 || rawPercent > 100) {
        return null;
      }
      // Check at most 2 decimals
      const bp = percentToBasisPoints(rawPercent);
      if (Math.abs(bp - rawPercent * 100) > 0.0001) {
        return null;
      }
      if (rawPercent > 0) {
        percentShares[id] = rawPercent;
        sumBasisPoints += bp;
      }
    }

    if (sumBasisPoints !== 10000) {
      return null;
    }

    const percentSplit: PercentSplit = { type: 'percent', shares: percentShares };
    return percentSplit;
  }

  return null;
}

export function parseExpense(
  v: unknown,
  knownMemberIds: ReadonlySet<MemberId>,
): Expense | null {
  if (!isRecord(v)) {
    return null;
  }

  const { id, description, amount, paidBy, date, category, split } = v;

  if (typeof id !== 'string' || id.trim() === '') {
    return null;
  }
  if (typeof description !== 'string' || description.trim() === '' || description.length > 60) {
    return null;
  }
  if (
    typeof amount !== 'number' ||
    !Number.isInteger(amount) ||
    amount <= 0 ||
    amount > MAX_AMOUNT_PAISE
  ) {
    return null;
  }
  if (typeof paidBy !== 'string' || !knownMemberIds.has(paidBy)) {
    return null;
  }
  if (typeof date !== 'string' || !isValidISODate(date)) {
    return null;
  }
  if (!isCategory(category)) {
    return null;
  }

  const validCategory: Category = category;
  const parsedSplit = parseSplit(split, amount, knownMemberIds);
  if (!parsedSplit) {
    return null;
  }

  return {
    id,
    description: description.trim(),
    amount,
    paidBy,
    date,
    category: validCategory,
    split: parsedSplit,
  };
}

export function parsePersistedState(v: unknown): PersistedState | null {
  if (!isRecord(v)) {
    return null;
  }

  const members = parseMembers(v['members']);
  if (!members) {
    return null;
  }

  const knownMemberIds = new Set<MemberId>(members.map((m) => m.id));
  const rawExpenses = v['expenses'];
  if (!Array.isArray(rawExpenses)) {
    return null;
  }

  const expenses: Expense[] = [];
  const seenExpenseIds = new Set<string>();

  for (const rawExpense of rawExpenses) {
    const expense = parseExpense(rawExpense, knownMemberIds);
    if (!expense || seenExpenseIds.has(expense.id)) {
      return null;
    }
    seenExpenseIds.add(expense.id);
    expenses.push(expense);
  }

  return { members, expenses };
}
