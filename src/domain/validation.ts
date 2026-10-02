import type { Category, Member, MemberId, NewExpense, Paise, Split } from './types';
import { isCategory } from './types';
import { MAX_AMOUNT_PAISE, formatINR, parsePercent, parseRupees } from './money';
import { isFutureDate, isValidISODate } from './dates';

export interface ExpenseDraft {
  description: string;
  amount: string;
  paidBy: string;
  date: string;
  category: string;
  splitType: 'equal' | 'exact' | 'percent';
  equalMemberIds: MemberId[];
  exactShares: Record<MemberId, string>;
  percentShares: Record<MemberId, string>;
}

export interface FormErrors {
  description?: string;
  amount?: string;
  paidBy?: string;
  date?: string;
  category?: string;
  split?: string; // group-level
  shares?: Record<MemberId, string>; // per-member
}

export type ValidationResult =
  | { ok: true; value: NewExpense }
  | { ok: false; errors: FormErrors };

export function validateExpenseDraft(
  draft: ExpenseDraft,
  ctx: { members: readonly Member[]; today: string },
): ValidationResult {
  const errors: FormErrors = {};

  // 1. Description
  const trimmedDesc = draft.description.trim();
  if (trimmedDesc === '') {
    errors.description = 'Description is required';
  } else if (trimmedDesc.length > 60) {
    errors.description = 'Description must be 60 characters or fewer';
  }

  // 2. Amount
  let validAmount: Paise | null = null;
  const parsedAmount = parseRupees(draft.amount);
  if (!parsedAmount.ok) {
    switch (parsedAmount.reason) {
      case 'empty':
        errors.amount = 'Amount is required';
        break;
      case 'negative':
        errors.amount = 'Amount must be more than ₹0';
        break;
      case 'too-many-decimals':
        errors.amount = 'Use at most 2 decimal places';
        break;
      case 'invalid':
      default:
        errors.amount = 'Enter a valid amount';
        break;
    }
  } else if (parsedAmount.paise <= 0) {
    errors.amount = 'Amount must be more than ₹0';
  } else if (parsedAmount.paise > MAX_AMOUNT_PAISE) {
    errors.amount = 'Amount must be ₹10,00,000 or less';
  } else {
    validAmount = parsedAmount.paise;
  }

  // 3. Paid by
  const isKnownMember = ctx.members.some((m) => m.id === draft.paidBy);
  if (!draft.paidBy || !isKnownMember) {
    errors.paidBy = 'Select who paid';
  }

  // 4. Date
  if (!draft.date.trim()) {
    errors.date = 'Date is required';
  } else if (!isValidISODate(draft.date)) {
    errors.date = 'Enter a valid date';
  } else if (isFutureDate(draft.date, ctx.today)) {
    errors.date = 'Date cannot be in the future';
  }

  // 5. Category
  let validCategory: Category | null = null;
  if (!isCategory(draft.category)) {
    errors.category = 'Select a category';
  } else {
    validCategory = draft.category;
  }

  // 6. Split validation (only active split type)
  let validSplit: Split | null = null;

  if (draft.splitType === 'equal') {
    if (draft.equalMemberIds.length === 0) {
      errors.split = 'Select at least one member';
    } else {
      const filteredIds = draft.equalMemberIds.filter((id) =>
        ctx.members.some((m) => m.id === id),
      );
      if (filteredIds.length === 0) {
        errors.split = 'Select at least one member';
      } else {
        validSplit = {
          type: 'equal',
          memberIds: filteredIds,
        };
      }
    }
  } else if (draft.splitType === 'exact') {
    const sharesErrors: Record<MemberId, string> = {};
    const exactSharesPaise: Record<MemberId, Paise> = {};
    let totalAssigned: Paise = 0;
    let hasShareErrors = false;

    for (const member of ctx.members) {
      const rawInput = draft.exactShares[member.id]?.trim() ?? '';
      if (rawInput === '') {
        exactSharesPaise[member.id] = 0;
      } else {
        const parsedShare = parseRupees(rawInput);
        if (!parsedShare.ok || parsedShare.paise < 0) {
          sharesErrors[member.id] = 'Enter ₹0 or more, up to 2 decimals';
          hasShareErrors = true;
        } else {
          exactSharesPaise[member.id] = parsedShare.paise;
          totalAssigned += parsedShare.paise;
        }
      }
    }

    if (hasShareErrors) {
      errors.shares = sharesErrors;
    } else if (validAmount !== null) {
      // Amount must be valid as precondition for exact-sum check
      if (totalAssigned < validAmount) {
        const diff = validAmount - totalAssigned;
        errors.split = `${formatINR(diff)} left to assign`;
      } else if (totalAssigned > validAmount) {
        const diff = totalAssigned - validAmount;
        errors.split = `${formatINR(diff)} over`;
      } else {
        // Only keep shares > 0 on save
        const savedShares: Record<MemberId, Paise> = {};
        for (const [id, paise] of Object.entries(exactSharesPaise)) {
          if (paise > 0) {
            savedShares[id] = paise;
          }
        }
        validSplit = {
          type: 'exact',
          shares: savedShares,
        };
      }
    }
  } else if (draft.splitType === 'percent') {
    const sharesErrors: Record<MemberId, string> = {};
    const percentSharesBp: Record<MemberId, number> = {};
    let totalBp = 0;
    let hasShareErrors = false;

    for (const member of ctx.members) {
      const rawInput = draft.percentShares[member.id]?.trim() ?? '';
      if (rawInput === '') {
        percentSharesBp[member.id] = 0;
      } else {
        const parsed = parsePercent(rawInput);
        if (!parsed.ok) {
          sharesErrors[member.id] = 'Enter between 0 and 100 with up to 2 decimals';
          hasShareErrors = true;
        } else {
          percentSharesBp[member.id] = parsed.basisPoints;
          totalBp += parsed.basisPoints;
        }
      }
    }

    if (hasShareErrors) {
      errors.shares = sharesErrors;
    } else {
      if (totalBp !== 10000) {
        const current = totalBp / 100;
        if (totalBp < 10000) {
          const left = (10000 - totalBp) / 100;
          errors.split = `Percentages must add up to 100 (currently ${current}, ${left} left)`;
        } else {
          const over = (totalBp - 10000) / 100;
          errors.split = `Percentages must add up to 100 (currently ${current}, ${over} over)`;
        }
      } else {
        // Only keep shares > 0 on save
        const savedShares: Record<MemberId, number> = {};
        for (const [id, bp] of Object.entries(percentSharesBp)) {
          if (bp > 0) {
            savedShares[id] = bp / 100;
          }
        }
        validSplit = {
          type: 'percent',
          shares: savedShares,
        };
      }
    }
  }

  // If any field in errors is defined, validation failed
  const hasErrors =
    errors.description !== undefined ||
    errors.amount !== undefined ||
    errors.paidBy !== undefined ||
    errors.date !== undefined ||
    errors.category !== undefined ||
    errors.split !== undefined ||
    (errors.shares !== undefined && Object.keys(errors.shares).length > 0);

  if (
    hasErrors ||
    validAmount === null ||
    validCategory === null ||
    validSplit === null ||
    !isKnownMember
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      description: trimmedDesc,
      amount: validAmount,
      paidBy: draft.paidBy,
      date: draft.date,
      category: validCategory,
      split: validSplit,
    },
  };
}
