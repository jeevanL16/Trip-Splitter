import {
  useReducer,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectMembers } from '../../features/expenses/selectors';
import { addExpense } from '../../features/expenses/expensesSlice';
import { CATEGORIES } from '../../domain/types';
import { todayISO } from '../../domain/dates';
import { validateExpenseDraft, type FormErrors } from '../../domain/validation';
import { createInitialDraft, formReducer } from './formReducer';
import { FormField } from '../../components/FormField';
import { SplitEditor } from './SplitEditor';
import './AddExpenseForm.css';

export function AddExpenseForm(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectMembers);

  const today = todayISO();

  const [draft, formDispatch] = useReducer(
    formReducer,
    null,
    () => createInitialDraft(members, today),
  );

  const [submitted, setSubmitted] = useState(false);

  // Derived validation result and errors
  const validationResult = validateExpenseDraft(draft, { members, today });
  const errors: FormErrors = submitted && !validationResult.ok ? validationResult.errors : {};

  function focusFirstError(formErrors: FormErrors): void {
    if (formErrors.description) {
      document.getElementById('description')?.focus();
    } else if (formErrors.amount) {
      document.getElementById('amount')?.focus();
    } else if (formErrors.paidBy) {
      document.getElementById('paidBy')?.focus();
    } else if (formErrors.date) {
      document.getElementById('date')?.focus();
    } else if (formErrors.category) {
      document.getElementById('category')?.focus();
    } else if (formErrors.split) {
      const radio = document.getElementById('split-type-equal');
      if (radio) {
        radio.focus();
      }
    } else if (formErrors.shares) {
      const firstMemberId = Object.keys(formErrors.shares)[0];
      if (firstMemberId) {
        const exactInput = document.getElementById(`exact-share-${firstMemberId}`);
        const percentInput = document.getElementById(`percent-share-${firstMemberId}`);
        if (exactInput) {
          exactInput.focus();
        } else if (percentInput) {
          percentInput.focus();
        }
      }
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setSubmitted(true);

    if (validationResult.ok) {
      dispatch(addExpense(validationResult.value));
      void navigate('/', { state: { flash: 'Expense added' } });
    } else {
      // Focus the first invalid input
      focusFirstError(validationResult.errors);
    }
  }

  function handleCancel(): void {
    if (location.key !== 'default') {
      void navigate(-1);
    } else {
      void navigate('/');
    }
  }

  const descLength = draft.description.length;

  return (
    <form noValidate onSubmit={handleSubmit} className="add-expense-form">
      <div className="form-fields-grid">
        {/* Description: NO maxLength attribute to allow testing 60+ char validation */}
        <div className="form-col-full">
          <FormField
            id="description"
            label="Description"
            required
            hint={`${descLength}/60 characters`}
            error={errors.description}
          >
            <input
              type="text"
              id="description"
              name="description"
              value={draft.description}
              placeholder="e.g. Dinner, Villa booking, Flight"
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? 'description-error' : 'description-hint'
              }
              onChange={(e) =>
                formDispatch({
                  type: 'set_field',
                  field: 'description',
                  value: e.target.value,
                })
              }
            />
          </FormField>
        </div>

        {/* Amount: type="text" inputMode="decimal" */}
        <div className="form-col-half">
          <FormField
            id="amount"
            label="Amount (₹)"
            required
            error={errors.amount}
          >
            <input
              type="text"
              inputMode="decimal"
              id="amount"
              name="amount"
              value={draft.amount}
              placeholder="e.g. 1250.50"
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? 'amount-error' : undefined}
              onChange={(e) =>
                formDispatch({
                  type: 'set_field',
                  field: 'amount',
                  value: e.target.value,
                })
              }
            />
          </FormField>
        </div>

        {/* Paid by: Select dropdown */}
        <div className="form-col-half">
          <FormField
            id="paidBy"
            label="Paid by"
            required
            error={errors.paidBy}
          >
            <select
              id="paidBy"
              name="paidBy"
              value={draft.paidBy}
              aria-invalid={Boolean(errors.paidBy)}
              aria-describedby={errors.paidBy ? 'paidBy-error' : undefined}
              onChange={(e) =>
                formDispatch({
                  type: 'set_field',
                  field: 'paidBy',
                  value: e.target.value,
                })
              }
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Date: YYYY-MM-DD max today */}
        <div className="form-col-half">
          <FormField
            id="date"
            label="Date"
            required
            error={errors.date}
          >
            <input
              type="date"
              id="date"
              name="date"
              max={today}
              value={draft.date}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? 'date-error' : undefined}
              onChange={(e) =>
                formDispatch({
                  type: 'set_field',
                  field: 'date',
                  value: e.target.value,
                })
              }
            />
          </FormField>
        </div>

        {/* Category: Select dropdown */}
        <div className="form-col-half">
          <FormField
            id="category"
            label="Category"
            required
            error={errors.category}
          >
            <select
              id="category"
              name="category"
              value={draft.category}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? 'category-error' : undefined}
              onChange={(e) =>
                formDispatch({
                  type: 'set_field',
                  field: 'category',
                  value: e.target.value,
                })
              }
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      {/* Split Editor */}
      <SplitEditor
        members={members}
        splitType={draft.splitType}
        equalMemberIds={draft.equalMemberIds}
        exactShares={draft.exactShares}
        percentShares={draft.percentShares}
        amountStr={draft.amount}
        errors={errors}
        onSetSplitType={(splitType) =>
          formDispatch({ type: 'set_split_type', splitType })
        }
        onToggleEqualMember={(memberId) =>
          formDispatch({ type: 'toggle_equal_member', memberId })
        }
        onSetExactShare={(memberId, value) =>
          formDispatch({ type: 'set_exact_share', memberId, value })
        }
        onSetPercentShare={(memberId, value) =>
          formDispatch({ type: 'set_percent_share', memberId, value })
        }
      />

      {/* Form Action Buttons */}
      <div className="form-actions">
        <button
          type="button"
          onClick={handleCancel}
          className="form-cancel-btn"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="form-submit-btn"
        >
          Save expense
        </button>
      </div>
    </form>
  );
}
