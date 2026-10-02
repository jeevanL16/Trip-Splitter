import type { ChangeEvent, ReactElement } from 'react';
import type { Member, MemberId } from '../../domain/types';
import type { FormErrors } from '../../domain/validation';
import { formatINR, parseRupees, parsePercent } from '../../domain/money';
import './SplitEditor.css';

interface SplitEditorProps {
  members: readonly Member[];
  splitType: 'equal' | 'exact' | 'percent';
  equalMemberIds: MemberId[];
  exactShares: Record<MemberId, string>;
  percentShares: Record<MemberId, string>;
  amountStr: string;
  errors: FormErrors;
  onSetSplitType: (type: 'equal' | 'exact' | 'percent') => void;
  onToggleEqualMember: (id: MemberId) => void;
  onSetExactShare: (id: MemberId, value: string) => void;
  onSetPercentShare: (id: MemberId, value: string) => void;
}

export function SplitEditor({
  members,
  splitType,
  equalMemberIds,
  exactShares,
  percentShares,
  amountStr,
  errors,
  onSetSplitType,
  onToggleEqualMember,
  onSetExactShare,
  onSetPercentShare,
}: SplitEditorProps): ReactElement {
  // Live helper calculations for exact and percent
  const parsedTotalAmount = parseRupees(amountStr);
  const totalPaiseTarget = parsedTotalAmount.ok ? parsedTotalAmount.paise : null;

  let assignedExactPaise = 0;
  for (const m of members) {
    const raw = exactShares[m.id]?.trim() ?? '';
    if (raw !== '') {
      const parsed = parseRupees(raw);
      if (parsed.ok && parsed.paise > 0) {
        assignedExactPaise += parsed.paise;
      }
    }
  }

  let assignedPercentBp = 0;
  for (const m of members) {
    const raw = percentShares[m.id]?.trim() ?? '';
    if (raw !== '') {
      const parsed = parsePercent(raw);
      if (parsed.ok && parsed.basisPoints > 0) {
        assignedPercentBp += parsed.basisPoints;
      }
    }
  }

  return (
    <div className="split-editor-container">
      {/* 1. Split Type Selector */}
      <fieldset className="split-type-fieldset">
        <legend className="split-legend">Split</legend>
        <div className="split-type-radios">
          <label className={`split-radio-label ${splitType === 'equal' ? 'split-radio-active' : ''}`}>
            <input
              type="radio"
              name="splitType"
              value="equal"
              checked={splitType === 'equal'}
              onChange={() => onSetSplitType('equal')}
              className="split-radio-input"
            />
            <span>Equally</span>
          </label>
          <label className={`split-radio-label ${splitType === 'exact' ? 'split-radio-active' : ''}`}>
            <input
              type="radio"
              name="splitType"
              value="exact"
              checked={splitType === 'exact'}
              onChange={() => onSetSplitType('exact')}
              className="split-radio-input"
            />
            <span>Exact amounts</span>
          </label>
          <label className={`split-radio-label ${splitType === 'percent' ? 'split-radio-active' : ''}`}>
            <input
              type="radio"
              name="splitType"
              value="percent"
              checked={splitType === 'percent'}
              onChange={() => onSetSplitType('percent')}
              className="split-radio-input"
            />
            <span>Percentages</span>
          </label>
        </div>
      </fieldset>

      {/* 2. Split Options Body */}
      {splitType === 'equal' && (
        <fieldset className="split-members-fieldset">
          <legend className="split-legend">Participating members</legend>
          <div className="equal-members-grid">
            {members.map((member) => {
              const isChecked = equalMemberIds.includes(member.id);
              return (
                <label key={member.id} className="equal-checkbox-label">
                  <input
                    type="checkbox"
                    id={`equal-member-${member.id}`}
                    checked={isChecked}
                    onChange={() => onToggleEqualMember(member.id)}
                    className="equal-checkbox-input"
                  />
                  <span>{member.name}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {splitType === 'exact' && (
        <div className="exact-shares-section">
          <div className="split-helper-banner" aria-live="polite">
            {totalPaiseTarget !== null ? (
              <span>
                Assigned <strong>{formatINR(assignedExactPaise)}</strong> of{' '}
                <strong>{formatINR(totalPaiseTarget)}</strong>
              </span>
            ) : (
              <span>Enter a valid total amount to see remaining balance</span>
            )}
          </div>

          <div className="shares-inputs-grid">
            {members.map((member) => {
              const inputId = `exact-share-${member.id}`;
              const shareError = errors.shares?.[member.id];
              return (
                <div key={member.id} className="share-input-row">
                  <label htmlFor={inputId} className="share-input-label">
                    {member.name} — amount (₹)
                  </label>
                  <div className="share-input-wrapper">
                    <span className="currency-prefix" aria-hidden="true">
                      ₹
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      id={inputId}
                      value={exactShares[member.id] ?? ''}
                      placeholder="0.00"
                      aria-invalid={Boolean(shareError)}
                      aria-describedby={shareError ? `${inputId}-error` : undefined}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onSetExactShare(member.id, e.target.value)
                      }
                      className="share-input-field"
                    />
                  </div>
                  {shareError && (
                    <p id={`${inputId}-error`} className="share-field-error" role="alert">
                      {shareError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {splitType === 'percent' && (
        <div className="percent-shares-section">
          <div className="split-helper-banner" aria-live="polite">
            <span>
              Assigned <strong>{(assignedPercentBp / 100).toFixed(2)}%</strong> of <strong>100%</strong>
            </span>
          </div>

          <div className="shares-inputs-grid">
            {members.map((member) => {
              const inputId = `percent-share-${member.id}`;
              const shareError = errors.shares?.[member.id];
              return (
                <div key={member.id} className="share-input-row">
                  <label htmlFor={inputId} className="share-input-label">
                    {member.name} — percent (%)
                  </label>
                  <div className="share-input-wrapper">
                    <input
                      type="text"
                      inputMode="decimal"
                      id={inputId}
                      value={percentShares[member.id] ?? ''}
                      placeholder="0"
                      aria-invalid={Boolean(shareError)}
                      aria-describedby={shareError ? `${inputId}-error` : undefined}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onSetPercentShare(member.id, e.target.value)
                      }
                      className="share-input-field"
                    />
                    <span className="percent-suffix" aria-hidden="true">
                      %
                    </span>
                  </div>
                  {shareError && (
                    <p id={`${inputId}-error`} className="share-field-error" role="alert">
                      {shareError}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Group-level Split Error */}
      {errors.split && (
        <p id="split-group-error" className="split-group-error" role="alert">
          <span aria-hidden="true">⚠ </span>
          {errors.split}
        </p>
      )}
    </div>
  );
}
