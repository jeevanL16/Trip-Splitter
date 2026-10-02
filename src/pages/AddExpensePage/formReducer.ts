import type { Member, MemberId } from '../../domain/types';
import type { ExpenseDraft } from '../../domain/validation';

export type FormAction =
  | {
      type: 'set_field';
      field: 'description' | 'amount' | 'paidBy' | 'date' | 'category';
      value: string;
    }
  | {
      type: 'set_split_type';
      splitType: 'equal' | 'exact' | 'percent';
    }
  | {
      type: 'toggle_equal_member';
      memberId: MemberId;
    }
  | {
      type: 'set_exact_share';
      memberId: MemberId;
      value: string;
    }
  | {
      type: 'set_percent_share';
      memberId: MemberId;
      value: string;
    };

export function createInitialDraft(members: readonly Member[], today: string): ExpenseDraft {
  return {
    description: '',
    amount: '',
    paidBy: '',
    date: today,
    category: '',
    splitType: 'equal',
    equalMemberIds: members.map((m) => m.id),
    exactShares: {},
    percentShares: {},
  };
}

export function formReducer(state: ExpenseDraft, action: FormAction): ExpenseDraft {
  switch (action.type) {
    case 'set_field':
      return {
        ...state,
        [action.field]: action.value,
      };

    case 'set_split_type':
      return {
        ...state,
        splitType: action.splitType,
      };

    case 'toggle_equal_member': {
      const exists = state.equalMemberIds.includes(action.memberId);
      const equalMemberIds = exists
        ? state.equalMemberIds.filter((id) => id !== action.memberId)
        : [...state.equalMemberIds, action.memberId];
      return {
        ...state,
        equalMemberIds,
      };
    }

    case 'set_exact_share':
      return {
        ...state,
        exactShares: {
          ...state.exactShares,
          [action.memberId]: action.value,
        },
      };

    case 'set_percent_share':
      return {
        ...state,
        percentShares: {
          ...state.percentShares,
          [action.memberId]: action.value,
        },
      };

    default:
      return state;
  }
}
