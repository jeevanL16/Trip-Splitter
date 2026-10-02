import { describe, it, expect } from 'vitest';
import { validateExpenseDraft } from './validation';
import type { ExpenseDraft } from './validation';
import type { Member } from './types';

describe('validation domain logic', () => {
  const members: Member[] = [
    { id: 'm1', name: 'Aarav' },
    { id: 'm2', name: 'Diya' },
    { id: 'm3', name: 'Kabir' },
  ];
  const today = '2026-04-01';
  const ctx = { members, today };

  const baseValidDraft: ExpenseDraft = {
    description: 'Dinner',
    amount: '100',
    paidBy: 'm1',
    date: '2026-04-01',
    category: 'Food',
    splitType: 'equal',
    equalMemberIds: ['m1', 'm2', 'm3'],
    exactShares: {},
    percentShares: {},
  };

  it('validates a completely valid equal split draft and returns typed NewExpense', () => {
    const res = validateExpenseDraft(baseValidDraft, ctx);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toEqual({
        description: 'Dinner',
        amount: 10000,
        paidBy: 'm1',
        date: '2026-04-01',
        category: 'Food',
        split: {
          type: 'equal',
          memberIds: ['m1', 'm2', 'm3'],
        },
      });
    }
  });

  describe('description validation', () => {
    it('requires description', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, description: '   ' }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.description).toBe('Description is required');
      }
    });

    it('rejects description longer than 60 characters', () => {
      const longDesc = 'a'.repeat(61);
      const res = validateExpenseDraft({ ...baseValidDraft, description: longDesc }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.description).toBe('Description must be 60 characters or fewer');
      }
    });
  });

  describe('amount validation', () => {
    it('requires amount', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, amount: '' }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.amount).toBe('Amount is required');
      }
    });

    it('rejects negative amount with specific message', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, amount: '-5' }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.amount).toBe('Amount must be more than ₹0');
      }
    });

    it('rejects zero amount', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, amount: '0' }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.amount).toBe('Amount must be more than ₹0');
      }
    });

    it('rejects non-numeric amount', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, amount: 'abc' }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.amount).toBe('Enter a valid amount');
      }
    });

    it('rejects more than 2 decimal places', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, amount: '12.345' }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.amount).toBe('Use at most 2 decimal places');
      }
    });

    it('rejects amount > ₹10,00,000 (10,00,000.01)', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, amount: '1000000.01' }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.amount).toBe('Amount must be ₹10,00,000 or less');
      }
    });
  });

  describe('paidBy validation', () => {
    it('requires paidBy to be a known member', () => {
      const res1 = validateExpenseDraft({ ...baseValidDraft, paidBy: '' }, ctx);
      expect(res1.ok).toBe(false);
      if (!res1.ok) {
        expect(res1.errors.paidBy).toBe('Select who paid');
      }

      const res2 = validateExpenseDraft({ ...baseValidDraft, paidBy: 'unknown_id' }, ctx);
      expect(res2.ok).toBe(false);
      if (!res2.ok) {
        expect(res2.errors.paidBy).toBe('Select who paid');
      }
    });
  });

  describe('date validation', () => {
    it('requires date', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, date: '' }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.date).toBe('Date is required');
      }
    });

    it('rejects invalid calendar date', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, date: '2026-02-30' }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.date).toBe('Enter a valid date');
      }
    });

    it('rejects future date', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, date: '2026-04-02' }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.date).toBe('Date cannot be in the future');
      }
    });

    it('accepts today', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, date: '2026-04-01' }, ctx);
      expect(res.ok).toBe(true);
    });
  });

  describe('category validation', () => {
    it('requires valid category', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, category: 'InvalidCategory' }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.category).toBe('Select a category');
      }
    });
  });

  describe('split validations', () => {
    it('equal split requires at least one selected member', () => {
      const res = validateExpenseDraft({ ...baseValidDraft, equalMemberIds: [] }, ctx);
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.split).toBe('Select at least one member');
      }
    });

    describe('exact split', () => {
      it('shows "left to assign" when exact sum is short', () => {
        const draft: ExpenseDraft = {
          ...baseValidDraft,
          amount: '100',
          splitType: 'exact',
          exactShares: {
            m1: '50',
            m2: '37.50',
            // total = 87.50, short by 12.50
          },
        };
        const res = validateExpenseDraft(draft, ctx);
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(res.errors.split).toBe('₹12.50 left to assign');
        }
      });

      it('shows "over" when exact sum exceeds total', () => {
        const draft: ExpenseDraft = {
          ...baseValidDraft,
          amount: '100',
          splitType: 'exact',
          exactShares: {
            m1: '60',
            m2: '50',
            // total = 110, over by 10
          },
        };
        const res = validateExpenseDraft(draft, ctx);
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(res.errors.split).toBe('₹10.00 over');
        }
      });

      it('validates per-member share input errors', () => {
        const draft: ExpenseDraft = {
          ...baseValidDraft,
          amount: '100',
          splitType: 'exact',
          exactShares: {
            m1: '-5',
            m2: 'invalid',
          },
        };
        const res = validateExpenseDraft(draft, ctx);
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(res.errors.shares?.m1).toBe('Enter ₹0 or more, up to 2 decimals');
          expect(res.errors.shares?.m2).toBe('Enter ₹0 or more, up to 2 decimals');
          // Sum check should NOT trigger fake numbers when shares are invalid
          expect(res.errors.split).toBeUndefined();
        }
      });

      it('saves only members with share > 0', () => {
        const draft: ExpenseDraft = {
          ...baseValidDraft,
          amount: '100',
          splitType: 'exact',
          exactShares: {
            m1: '60',
            m2: '40',
            m3: '0',
          },
        };
        const res = validateExpenseDraft(draft, ctx);
        expect(res.ok).toBe(true);
        if (res.ok) {
          expect(res.value.split).toEqual({
            type: 'exact',
            shares: {
              m1: 6000,
              m2: 4000,
            },
          });
        }
      });
    });

    describe('percent split', () => {
      it('rejects percent sum not totalling 100 (99.99)', () => {
        const draft: ExpenseDraft = {
          ...baseValidDraft,
          amount: '100',
          splitType: 'percent',
          percentShares: {
            m1: '33.33',
            m2: '33.33',
            m3: '33.33', // 99.99% total
          },
        };
        const res = validateExpenseDraft(draft, ctx);
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(res.errors.split).toBe(
            'Percentages must add up to 100 (currently 99.99, 0.01 left)',
          );
        }
      });

      it('accepts exact 100% total and saves only shares > 0', () => {
        const draft: ExpenseDraft = {
          ...baseValidDraft,
          amount: '100',
          splitType: 'percent',
          percentShares: {
            m1: '60',
            m2: '40',
            m3: '',
          },
        };
        const res = validateExpenseDraft(draft, ctx);
        expect(res.ok).toBe(true);
        if (res.ok) {
          expect(res.value.split).toEqual({
            type: 'percent',
            shares: {
              m1: 60,
              m2: 40,
            },
          });
        }
      });

      it('shows per-member errors for invalid percentages', () => {
        const draft: ExpenseDraft = {
          ...baseValidDraft,
          amount: '100',
          splitType: 'percent',
          percentShares: {
            m1: '105', // > 100
            m2: '-10',
            m3: '12.345', // > 2 decimals
          },
        };
        const res = validateExpenseDraft(draft, ctx);
        expect(res.ok).toBe(false);
        if (!res.ok) {
          expect(res.errors.shares?.m1).toBe(
            'Enter between 0 and 100 with up to 2 decimals',
          );
          expect(res.errors.shares?.m2).toBe(
            'Enter between 0 and 100 with up to 2 decimals',
          );
          expect(res.errors.shares?.m3).toBe(
            'Enter between 0 and 100 with up to 2 decimals',
          );
        }
      });
    });
  });

  it('collects multiple errors together across different fields', () => {
    const invalidDraft: ExpenseDraft = {
      description: '',
      amount: '-10',
      paidBy: '',
      date: '2026-04-10', // future
      category: '',
      splitType: 'equal',
      equalMemberIds: [],
      exactShares: {},
      percentShares: {},
    };
    const res = validateExpenseDraft(invalidDraft, ctx);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.description).toBe('Description is required');
      expect(res.errors.amount).toBe('Amount must be more than ₹0');
      expect(res.errors.paidBy).toBe('Select who paid');
      expect(res.errors.date).toBe('Date cannot be in the future');
      expect(res.errors.category).toBe('Select a category');
      expect(res.errors.split).toBe('Select at least one member');
    }
  });
});
